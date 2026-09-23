# Por que `fmt.Errorf` produz respostas HTTP 500 em erros esperados

## O fluxo atual

Os services retornam valores do tipo `error`. Parte deles cria esses valores com `fmt.Errorf`, por exemplo quando uma sessão não existe:

```go
return nil, fmt.Errorf("session %s not found", id)
```

O handler recebe o erro e o passa para `writeError`. Essa função, em `api/internal/handler/response.go`, só reconhece um tipo concreto:

```go
if appErr, ok := err.(*apperror.AppError); ok {
    writeJSON(w, appErr.Code, map[string]string{"error": appErr.Message})
    return
}
writeJSON(w, http.StatusInternalServerError,
    map[string]string{"error": "internal server error"})
```

Em Go, `error` é uma interface. A expressão `err.(*apperror.AppError)` verifica o **tipo concreto** armazenado nela; não examina o texto de `err.Error()` e não infere que a frase `not found` deveria corresponder a 404. O erro criado por `fmt.Errorf` não é um `*apperror.AppError`. A verificação retorna `ok == false` e a execução cai no ramo padrão de 500.

Por isso, a mensagem produzida no service existe, mas é descartada na resposta HTTP. O cliente recebe `{"error":"internal server error"}`, e não a mensagem sobre a sessão ausente. O próprio `fmt.Errorf` não escolhe um status HTTP: o falso 500 resulta da **falta de classificação do erro** combinada com o comportamento padrão de `writeError`.

## Por que alguns erros funcionam

`apperror.BadRequest(...)` e `apperror.NotFound(...)` retornam `*apperror.AppError`, que contém `Code` e `Message`. Quando um service devolve esse valor diretamente, `writeError` encontra o tipo e utiliza o status e a mensagem definidos. Por exemplo, a criação de sessão sem decks retorna 400, e a consulta de cards de uma sessão inexistente retorna 404.

Já outras operações equivalentes usam `fmt.Errorf`. A busca da mesma sessão por ID retorna 500 quando ela não existe. Assim, a diferença de status vem do **tipo de erro criado em cada caminho**, não do recurso nem da gravidade real da situação.

## Casos observados com testes mockados

Testes HTTP temporários, com repositórios mockados e sem banco de dados, reproduziram os seguintes resultados:

| Situação | Erro gerado | Resposta atual |
| --- | --- | --- |
| Criar sessão sem decks | `apperror.BadRequest` | 400 com a mensagem do service |
| Consultar sessão inexistente por ID | `fmt.Errorf` | 500 com `internal server error` |
| Consultar estudo de sessão inexistente | `apperror.NotFound` | 404 com a mensagem do service |
| Atualizar sessão com nome vazio | `fmt.Errorf` | 500 com `internal server error` |
| Consultar deck inexistente | `fmt.Errorf` | 500 com `internal server error` |
| Criar card em deck inexistente | `fmt.Errorf` | 500 com `internal server error` |
| Enviar avaliação fora da faixa permitida | `fmt.Errorf` | 500 com `internal server error` |
| Cadastrar e-mail já existente | `fmt.Errorf` | 500 com `internal server error` |

Também foram observados 500 para JSON malformado e UUID inválido quando o handler enviou diretamente os erros de parsing a `writeError`. Esses casos não são criados pelos services, mas seguem o mesmo ramo padrão: não são `*apperror.AppError`.

## Nuance sobre erros encapsulados

Mesmo que um service encapsule um `*apperror.AppError` com `fmt.Errorf("contexto: %w", err)`, a verificação direta `err.(*apperror.AppError)` falha, porque o tipo concreto do erro externo não é `*apperror.AppError`. `errors.As` pode percorrer essa cadeia e encontrar o erro tipado original. Porém, essa mudança isolada não classificaria os `fmt.Errorf` simples mostrados acima: eles ainda precisariam carregar uma categoria de erro conhecida.

## Direção para a correção

Classificar explicitamente os erros esperados na camada de service, como entrada inválida, recurso inexistente e conflito; preservar erros técnicos para diagnóstico interno; e fazer o handler traduzir as categorias em status HTTP. `writeError` deve reconhecer erros tipados mesmo quando estiverem encapsulados e manter 500 genérico apenas para falhas realmente não classificadas. Comparar frases de `err.Error()` para decidir o status seria frágil, pois uma alteração no texto mudaria o comportamento da API.

Este documento explica o comportamento atual; não altera a implementação.
