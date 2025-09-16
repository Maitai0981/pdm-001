# SupaSport

## Descrição do Projeto

SupaSport é um aplicativo mobile desenvolvido com React Native e Expo, utilizando Supabase como backend. O objetivo do projeto é oferecer uma plataforma completa para que usuários possam encontrar, reservar e pagar por horários em estabelecimentos esportivos, como quadras e ginásios. Proprietários de estabelecimentos também podem cadastrar e gerenciar seus locais de forma simples e intuitiva.

## Funcionalidades

  * **Autenticação de Usuário**: Cadastro e login com e-mail e senha.
  * **Pesquisa de Estabelecimentos**: Pesquisa dinâmica por nome de estabelecimentos disponíveis.
  * **Detalhes do Local**: Visualização de informações completas do estabelecimento, incluindo fotos (dia e noite), horários de funcionamento, infraestrutura e valor de reserva.
  * **Sistema de Reservas**: Seleção de datas e horários disponíveis com base na agenda do local.
  * **Pagamento com PIX**: Geração automática de QR Code e código `copia e cola` para pagamento via PIX.
  * **Perfil do Usuário**: Visualização de reservas ativas e edição de dados do perfil.
  * **Gerenciamento de Estabelecimentos (Proprietário)**:
      * Criação de novos estabelecimentos com detalhes como tipo, cidade, CEP, horários e chave PIX.
      * Upload de imagens (dia e noite) para o perfil do local.
      * Edição e exclusão de estabelecimentos cadastrados.

## Tecnologias

O projeto foi construído com as seguintes tecnologias principais:

  * **Frontend**:
      * [React Native](https://reactnative.dev/): Biblioteca para construir interfaces de usuário.
      * [Expo](https://expo.dev/): Framework que simplifica o desenvolvimento e build do aplicativo.
      * [React Navigation](https://reactnavigation.org/): Gerenciamento de navegação entre telas.
      * `react-native-qrcode-svg` e `react-qrcode-pix`: Geração do QR Code dinâmico para pagamentos.
  * **Backend**:
      * [Supabase](https://supabase.io/): Backend-as-a-Service para banco de dados e autenticação.

## Como Iniciar o Projeto

Para executar o projeto localmente, siga os passos abaixo:

1.  **Clone o repositório:**

    ```
    git clone https://github.com/maitai0981/pdm-001.git
    cd pdm-001
    ```

2.  **Instale as dependências:**

    ```
    npm install
    # ou
    yarn install
    ```

3.  **Inicie o Expo:**

    ```
    expo start
    ```

    Isso abrirá uma nova janela no seu navegador. Você pode escanear o QR Code com o aplicativo Expo Go no seu celular ou tablet, ou usar um dos emuladores.

4.  **Configuração do Supabase**:

      * Crie um novo projeto no Supabase.
      * Copie a URL da API e a `anon key` e adicione-as no arquivo `supabaseClient.js`.
      * Configure as tabelas e políticas de acesso (RLS) conforme a estrutura necessária para o funcionamento do app. A lógica de interação com as tabelas `usuarios`, `estabelecimentos`, `reservas`, `horarios_disponiveis` e outras, está detalhada nos arquivos de tela, como `CadastroEstabelecimento.js` e `EstabelecimentoDetalhes.js`.

## Estrutura de Arquivos

  * `App.js`: Ponto de entrada do aplicativo.
  * `routes.js`: Configuração de navegação.
  * `supabaseClient.js`: Configurações do Supabase.
  * `screens/`: Contém os componentes de tela da aplicação.
  * `assets/`: Contém as imagens e ícones do projeto.

## Licença

Este projeto está sob a licença 0BSD.
