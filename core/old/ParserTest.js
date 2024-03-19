import Brain from '../../Brain.js'

let veryWrongJson = `{
    "empresa": "Tecnologia Avançada SA,
    "endereco": {
      "rua": "Av. Inovação, 1000,
      "bairro": "Novo Horizonte", cidade: "Cidade Futuro",
      "estado": "Estado", "cep: "12345-000"
    },
    "departamentos": [
      {"nome": Desenvolvimento, "piso": 5, funcionarios": 120},
      {"nome": "Recursos Humanos, "piso": 2, "funcionarios: 30,
      {"nome": "Vendas", "piso: "3", funcionarios": 50},
      {"nome": Suporte, "piso": 4, "funcionarios": 40,}
      {"nome": "Marketing", "piso": 6, "funcionarios" 35}
    ],
    "funcionarios": [
      {"nome": "Carlos Silva", "departamento": Desenvolvimento", "cargo": "Engenheiro de Software, "idade": 32},
      {"nome": "Aline Ferreira, "departamento": "Marketing, "cargo": "Analista de Marketing Digital", "idade": 28},
      {"nome": "Roberto Nunes", departamento": "Recursos Humanos, "cargo": Recrutador", "idade": "trinta e cinco"},
      {"nome": "Mariana Rocha", "departamento": "Vendas, "cargo": "Representante de Vendas", "idade": 27}
    ],
    "financeiro": {
      "receita": 5000000.00,
      "despesas": 2000000.00,
      "lucro": 3000000.00
    },
    "contato": {
      "telefone": "(11) 9999-9999",
      "email": contato@tecnologiaavancada.com.br"
    }
  }`
  
  
  let wrongjson = `{
      "nome": "Exemplo Inc",
      "localizacao": {
        "cidade": "São Paulo",
        "pais": "Brasil",
        "cep": "01000-000
      },
      "funcionarios": [
        {"nome": "Ana Silva", "idade": 30, "cargo": "Desenvolvedora"},
        {"nome": "Pedro Andrade", "idade": "35", "cargo": Engenheiro de Software"},
        {"nome": "Marcos Ribeiro, "idade": 40, "cargo": "Gerente de Projetos"}
      ],
      "financeiro": {
        "receita": 500000.00,
        "despesas": 200000.00,
        "lucro": null
      },
      "produtos": [
        {"nome": "Produto A", "preco": 50.00, "emEstoque": true
        {"nome": Produto B", "preco": 75.50, "emEstoque": false},
        {"nome": "Produto C", "preco: 100.00, "emEstoque": true},
      ],
      contato: {
        "telefone": "(11) 4002-8922",
        "email": "contato@exemploinc.com"
      }
    }
    `
  
    console.log(await Brain.Parser(veryWrongJson))