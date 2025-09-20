# 🗺️ Roterize

Um aplicativo web moderno para planejamento de rotas e navegação, desenvolvido com React e integração com Google Maps API.

## 📋 Sobre o Projeto

O Roterize é uma aplicação web que permite aos usuários:
- Buscar e adicionar locais usando autocomplete
- Planejar rotas entre múltiplos pontos
- Escolher diferentes modos de transporte (caminhada, carro, bicicleta, transporte público)
- Visualizar direções detalhadas no mapa
- Interface minimalista e profissional

## 🚀 Tecnologias Utilizadas

- **React** - Biblioteca JavaScript para construção da interface
- **Google Maps API** - Integração com mapas e serviços de localização
- **@react-google-maps/api** - Componentes React para Google Maps
- **CSS3** - Estilização com design minimalista
- **JavaScript ES6+** - Funcionalidades modernas do JavaScript

## 📦 Instalação

### Pré-requisitos
- Node.js (versão 14 ou superior)
- npm ou yarn
- Chave da API do Google Maps

### Passos para instalação

1. Clone o repositório:
```bash
git clone https://github.com/leocostarj22/roterize-app.git
cd roterize-app
```

2. Instale as dependências:
```bash
npm install
```

3. Configure a API do Google Maps:
   - Obtenha uma chave da API no [Google Cloud Console](https://console.cloud.google.com/)
   - Ative as APIs: Maps JavaScript API, Places API, Directions API
   - Adicione sua chave no arquivo de configuração

4. Inicie o servidor de desenvolvimento:
```bash
npm start
```

5. Acesse a aplicação em `http://localhost:3000`

## 🎯 Funcionalidades

### ✅ Implementadas
- [x] Interface de usuário minimalista
- [x] Busca de locais com autocomplete
- [x] Adição de múltiplos pontos de interesse
- [x] Seleção de modo de transporte
- [x] Visualização de rotas no mapa
- [x] Direções passo a passo
- [x] Design responsivo

### 🔄 Em Desenvolvimento
- [ ] Salvamento de rotas favoritas
- [ ] Compartilhamento de rotas
- [ ] Estimativa de tempo e distância
- [ ] Modo escuro
- [ ] Suporte a múltiplos idiomas

## 🎨 Design

O Roterize segue um design minimalista e profissional com:
- Paleta de cores neutras
- Tipografia limpa e legível
- Espaçamentos consistentes
- Elementos sem bordas arredondadas
- Foco na usabilidade

## 📱 Responsividade

A aplicação é totalmente responsiva e funciona em:
- 💻 Desktop
- 📱 Smartphones
- 📟 Tablets

## 🛠️ Scripts Disponíveis

```bash
npm start          # Inicia o servidor de desenvolvimento
npm test           # Executa os testes
npm run build      # Cria build de produção
npm run eject      # Ejeta as configurações (irreversível)
```

## 📂 Estrutura do Projeto
roterize-app/
├── public/
│   ├── index.html
│   └── manifest.json
├── src/
│   ├── App.js          # Componente principal
│   ├── App.css         # Estilos principais
│   ├── index.js        # Ponto de entrada
│   └── roterize.png    # Logo da aplicação
├── package.json
└── README.md


## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

**Leonardo Costa**
- GitHub: [@leocostarj22](https://github.com/leocostarj22)

## 🙏 Agradecimentos

- Google Maps API pela integração de mapas
- React community pelas ferramentas e bibliotecas
- Todos os contribuidores do projeto

---

⭐ Se este projeto te ajudou, considere dar uma estrela no repositório!