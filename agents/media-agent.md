# 🖼️ AGENTE 5: GERENCIAMENTO DE MÍDIAS E IMAGENS (Media Conduct)

Este documento define as regras obrigatórias, fluxo de processamento, regras de segurança e manutenção para o sistema de upload e tratamento de imagens no Backend do projeto.

---

## 🛑 Regras Fundamentais de Gerenciamento de Mídias

1. **Abstração do Caminho Físico**:
   - O caminho físico do arquivo no sistema de arquivos (`uploads/...`) NUNCA deve ser exposto ao cliente ou frontend.
   - O acesso às imagens deve ser realizado EXCLUSIVAMENTE via endpoint `GET /api/media/:id`.

2. **Segurança e Validação de Upload**:
   - Aceitar os formatos de imagem permitidos: **PNG, JPG, JPEG, WEBP e GIF**.
   - Validar rigorosamente a extensão do arquivo e o **MIME Type** (`image/png`, `image/jpeg`, `image/jpg`, `image/webp`, `image/gif`).
   - Limites de tamanho: **25 MB** para imagens padrão (PNG/JPG/WEBP) e **50 MB** para **GIFs**. Rejeitar imediatamente arquivos maiores ou maliciosos.
   - **Suporte a Base64**: O sistema suporta uploads tanto por `multipart/form-data` quanto por strings de dados em Base64 (`data:image/gif;base64,...`).

3. **Processamento, Renomeação e Otimização Automática (`sharp`)**:
   - **Renomeação Obrigatória**: Todo arquivo físico salvo no disco DEVE ser obrigatoriamente renomeado para um identificador único seguro (ex: `media_<uuid>.webp` ou `media_<uuid>.gif`), evitando colisão de nomes ou exposição de nomes de arquivo originais.
   - **Suporte a GIF (Preservação de Animação)**: GIFs NÃO passam por conversão para WebP ou compressão destrutiva, mantendo seus quadros de animação originais intactos salvos como `media_<uuid>.gif`.
   - **Conversão WebP para Imagens Estáticas**: Imagens estáticas (PNG, JPG, JPEG) são automaticamente convertidas para `.webp`.
   - **Remoção de Metadados (EXIF)**: Remover metadados sensíveis de imagens estáticas.
   - **Redimensionamento**: Imagens estáticas com largura superior a **1920px** são redimensionadas mantendo a proporção original.

4. **Persistência no Banco de Dados (`Media` model)**:
   - Todo arquivo processado gera um registro no Prisma na tabela `Media` contendo:
     - `id` (UUID único)
     - `originalName` (nome original enviado)
     - `fileName` (nome final renomeado gerado no disco, ex: `media_<uuid>.webp`)
     - `mimeType` (`image/webp`)
     - `extension` (`.webp`)
     - `size` (tamanho final em bytes)
     - `width` e `height` (dimensões da imagem processada)
     - `createdAt` e `updatedAt`

5. **Manutenção e Limpeza de Arquivos Órfãos**:
   - **Deleção Individual**: `DELETE /api/media/:id` remove a entrada no banco e apaga o arquivo físico correspondente do disco.
   - **Limpeza de Órfãos**: Implementar rotina (`POST /api/media/clean-orphans`) para varrer a pasta de upload e remover arquivos sem registro no banco, além de remover do banco registros cujo arquivo físico não exista.

6. **Integração com Notícias**:
   - Notícias usam o id da imagem como `coverImageId` e/ou a URL exposta (`GET /api/media/:id`) no corpo do conteúdo em HTML/Markdown.
