# Documentação para Preenchimento da Planilha Modelo

## Estrutura da Planilha

A planilha deve conter as seguintes colunas:

### Para Análise de Nível Intermediário e Superior:

- **Pavimento**: Identificação do pavimento (ex.: "Cobertura", "Térreo").
- **Unidade**: Unidade habitacional (ex.: "Term 01").
- **Código**: Identificador único para cada ambiente.
- **Nome**: Nome do ambiente (ex.: "Sala", "Suite").
- **Tipo de Ambiente**: Tipo do ambiente (ex.: "Sala", "Quarto").
- **Area**: Área correspondente ao ambiente (não deve conter acentos).

### Para Análise de Nível Mínimo:

- **Pavimento**: Identificação do pavimento.
- **Unidade**: Unidade habitacional.
- **Código**: Identificador único.
- **Nome**: Nome do ambiente.
- **Tipo de Ambiente**: Tipo do ambiente.

> **Nota:** A coluna **Area** não é necessária para análises de nível mínimo.

---

## Regras de Preenchimento

### 1. Pavimento

- Caso a análise seja **Unifamiliar**, preencha a coluna **Pavimento** com "Unifamiliar" ou "unifamiliar".
- Para outras análises, insira o pavimento correspondente (ex.: "Cobertura", "Térreo").

### 2. Unidade

- Preencha com o identificador da Unidade Habitacional (UH), como "Term 01" ou "Term 02".
- **Quando os dados forem por aplicativo (app):**
  - Repita o valor da unidade habitacional para todos os aplicativos que pertencem à mesma UH.

### 3. Código

- Insira um código único para cada ambiente (ex.: "A60B4E").

### 4. Nome

- Nomeie o ambiente de acordo com sua função, como "Sala", "Suite", "Quarto 1".

### 5. Tipo de Ambiente

- Classifique o ambiente, como "Sala", "Quarto", "Suite".

### 6. Area

- A coluna **Area** deve ser preenchida apenas para análises de nível intermediário e superior.
- A área é relativa à Unidade Habitacional (UH).
  - **Exemplo**: Se uma UH possui 100m², todos os ambientes (apps) pertencentes àquela UH devem repetir este valor na coluna **Area**.

---

## Exemplo de Preenchimento

### Nível Intermediário e Superior:

| Pavimento | Unidade | Código | Nome     | Tipo de Ambiente | Area   |
| --------- | ------- | ------ | -------- | ---------------- | ------ |
| Cobertura | Term 01 | A60B4E | Sala     | Sala             | 100,52 |
| Cobertura | Term 01 | FA2868 | Suite    | Quarto           | 100,52 |
| Cobertura | Term 01 | 78A222 | Quarto 1 | Quarto           | 100,52 |

### Nível Mínimo:

| Pavimento | Unidade | Código | Nome     | Tipo de Ambiente |
| --------- | ------- | ------ | -------- | ---------------- |
| Cobertura | Term 01 | A60B4E | Sala     | Sala             |
| Cobertura | Term 01 | FA2868 | Suite    | Quarto           |
| Cobertura | Term 01 | 78A222 | Quarto 1 | Quarto           |

---

## Considerações Finais

- Certifique-se de seguir o formato correto para evitar erros no processamento dos dados pelo programa.
- Não utilize caracteres especiais ou acentos, especialmente na coluna **Area**.

Se necessário, entre em contato com a equipe responsável pelo programa para esclarecimentos adicionais.
