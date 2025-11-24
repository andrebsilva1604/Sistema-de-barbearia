=========================================================================
PROJETO: SMART BARBER - SISTEMA DE AGENDAMENTO WEB (TCC)
AUTOR: [SEU NOME AQUI]
=========================================================================

DESCRIÇÃO:
Sistema Web Full-Stack para gerenciamento de agendamentos em barbearias.
Desenvolvido utilizando JavaScript (Node.js no Backend e Vanilla JS no Frontend).

-------------------------------------------------------------------------
1. PRÉ-REQUISITOS (O que precisa ter instalado no computador)
-------------------------------------------------------------------------
Antes de começar, certifique-se de ter instalado:

1. Node.js (Versão 14 ou superior)
   - Download: https://nodejs.org/
   - Para verificar se já tem, digite no terminal: node -v

2. Git (Para clonar o repositório)

-------------------------------------------------------------------------
2. INSTALAÇÃO (Passo a Passo)
-------------------------------------------------------------------------
Siga estes passos na ordem exata:

1. Abra o terminal na pasta raiz do projeto "agendamento-barbearia".

2. Instale as dependências do projeto executando:
   
   npm install

   OBSERVAÇÃO PARA LINUX:
   Se ocorrer erro na instalação do 'sqlite3', instale as ferramentas de build:
   sudo apt install build-essential
   E rode 'npm install' novamente.

-------------------------------------------------------------------------
3. COMO RODAR O SERVIDOR
-------------------------------------------------------------------------
Após a instalação das dependências:

1. No terminal, dentro da pasta do projeto, execute:

   node server.js

2. Você deverá ver a mensagem:
   "Servidor rodando em http://localhost:3000"

   IMPORTANTE: Mantenha este terminal aberto. Se fechá-lo, o site sai do ar.

-------------------------------------------------------------------------
4. COMO ACESSAR O SITE
-------------------------------------------------------------------------
1. Abra seu navegador (Chrome, Edge, Firefox, etc.).
2. Acesse: http://localhost:3000

-------------------------------------------------------------------------
5. GUIA DE TESTE (Funcionalidades)
-------------------------------------------------------------------------
1. Registro: Crie uma conta para testar a segurança (bcrypt).
2. Login: Entre com a conta criada.
3. Agendamento:
   - Escolha Barbeiro, Serviço e Data.
   - O sistema filtrará automaticamente os horários livres.
4. Teste de Conflito:
   - Tente agendar o mesmo horário duas vezes para ver o bloqueio.
5. Dashboard:
   - Clique em "Meus Agendamentos".
   - Use o botão "Cancelar" para excluir um agendamento.
   - Clique em "Ver Estatísticas" para ver os gráficos gerados.

-------------------------------------------------------------------------
6. OBSERVAÇÕES TÉCNICAS E RESET
-------------------------------------------------------------------------
- Banco de Dados: O sistema utiliza SQLite (arquivo 'barbearia.db').
- Como Resetar: Para limpar o banco e começar do zero (ideal para apresentações):
  1. Pare o servidor (Ctrl + C).
  2. Delete o arquivo 'barbearia.db'.
  3. Inicie o servidor novamente (node server.js).
  *O sistema recriará o banco e inserirá os dados padrão automaticamente.*

=========================================================================
