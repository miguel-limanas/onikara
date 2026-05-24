# Technology Stack

A stack tecnológica do **Sistema RPG** foi projetada para ser leve, modular e rodar totalmente em ambiente local utilizando tecnologias web padrão para o cliente e serviços conteinerizados para a persistência de dados.

## Frontend & Motor de Jogo (Cliente)
*   **HTML5 & CSS3**: Estrutura e estilização visual pura (Vanilla CSS). Layout moderno baseado em CSS Grid e Flexbox com um tema dark/premium e micro-animações.
*   **Vanilla JavaScript (ES6+)**: Lógica completa do motor de combate, classes, raças, magias e gerenciamento de estado executada de forma modular utilizando ES Modules (`import`/`export`).
*   **Supabase JS Client (`@supabase/supabase-js`)**: Integração direta no cliente para persistência, autenticação e comunicação com os serviços de banco de dados.

## Backend & Persistência (Serviços Conteinerizados)
*   **Supabase (Self-Hosted em Docker)**: Uma alternativa open-source ao Firebase executada inteiramente local por meio de containers.
    *   **PostgreSQL**: Banco de dados relacional que gerencia tabelas de personagens, atributos, XP, inventário e progresso.
    *   **Supabase Auth**: Gerenciamento completo de usuários, sessões e autenticação local.
    *   **PostgREST**: Exposição automática das tabelas do banco em uma API REST segura e instantânea no cliente.
*   **Docker & Docker Compose**: Orquestração local dos serviços do Supabase (db, auth, rest API, real-time) garantindo portabilidade absoluta e setup rápido com um único comando.

## Ferramental de Desenvolvimento
*   **Node.js / npm**: Gerenciamento de dependências locais de desenvolvimento e facilitação de scripts de execução do servidor de desenvolvimento local.
*   **Git**: Versionamento de código e controle do ciclo de vida sob a metodologia GSD.
