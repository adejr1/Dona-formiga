# Planos de Corte Ade

Calculadora profissional para planejamento de cortes em chapas para seccionadora, com organização por eixos longitudinal e transversal.

## Funcionalidades

### Dados do Projeto
- **Nome da Peça**: Identificação da peça sendo produzida
- **Nome do Produto**: Nome do produto final
- **Data**: Registro automático da data de criação

### Configuração da Chapa
- **Largura Total**: Dimensão da chapa no eixo longitudinal (padrão: 2200mm)
- **Comprimento Total**: Dimensão da chapa no eixo transversal (padrão: 2750mm)
- **Espessura da Serra**: Valor somado a cada unidade cortada (padrão: 4mm)

### Lançamento de Peças
- **Código de Direção**:
  - `3` → Eixo Longitudinal (cor Verde)
  - `4` ou `44` → Eixo Transversal (cor Azul)
- **Medida da Peça**: Valor em milímetros
- **Quantidade**: Número de peças a cortar

### Visualização Gráfica
- Desenho do plano de corte com todas as peças
- Medidas exibidas na orientação da maior dimensão
- Área de sobra destacada em amarelo
- Número sequencial em cada peça

### Impressão
- Botão para imprimir o plano de corte
- Inclui dados do projeto, desenho e lista de peças
- Formatação otimizada para papel A4 paisagem

### Cálculo Automático
- Fórmula: `(Medida + Espessura da Serra) × Quantidade`
- Visualização em tempo real do consumo por eixo
- Cálculo de sobra restante da chapa
- Alertas visuais quando o consumo excede a dimensão da chapa

## Estrutura do Projeto

```
src/
├── types/
│   └── corte.ts          # Tipos TypeScript
├── store/
│   └── corte/
│       └── useCorteStore.ts  # Estado com Zustand
├── components/
│   └── corte/
│       └── VisualizacaoCorte.tsx  # Componente de visualização
├── pages/
│   └── corte/
│       └── CalculadoraCorte.tsx  # Componente principal
└── App.tsx               # Ponto de entrada
```

## Tecnologias

- React 18 + TypeScript
- Vite 7 (Build tool)
- Tailwind CSS (Estilização)
- Zustand (Gerenciamento de estado)
- Lucide React (Ícones)

## Como Usar

1. **Dados do Projeto**: Preencha o nome da peça e do produto
2. **Configure a Chapa**: Ajuste as dimensões e espessura da serra
3. **Adicione Peças**: Selecione o código de direção, medida e quantidade
4. **Visualize**: Acompanhe o desenho do plano de corte em tempo real
5. **Imprima**: Clique no botão "Imprimir" para gerar o documento
