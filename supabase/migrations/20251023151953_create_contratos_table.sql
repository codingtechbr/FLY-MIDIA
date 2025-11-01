/*
  # Criar tabela de contratos
  
  1. Nova Tabela
    - `contratos`
      - `id` (uuid, chave primária)
      - `nome_empresa` (text) - Nome da empresa/cliente
      - `cpf_cliente` (text) - CPF do cliente (formatado)
      - `tipo_produto` (text) - Tipo de serviço contratado
      - `valor_contrato` (numeric) - Valor do contrato
      - `data_vencimento` (date) - Data de vencimento
      - `cidade` (text) - Cidade do cliente
      - `status_pagamento` (boolean) - Status do pagamento (pago/aberto)
      - `observacoes` (text) - Observações adicionais
      - `created_at` (timestamptz) - Data de criação
      - `updated_at` (timestamptz) - Data de atualização
  
  2. Segurança
    - Habilitar RLS na tabela `contratos`
    - Política para permitir leitura pública (consulta por CPF)
    - Política para permitir inserção/atualização/exclusão apenas por usuários autenticados
  
  3. Índices
    - Criar índice no campo `cpf_cliente` para otimizar buscas
*/

-- Criar tabela de contratos
CREATE TABLE IF NOT EXISTS contratos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_empresa text NOT NULL,
  cpf_cliente text NOT NULL,
  tipo_produto text NOT NULL,
  valor_contrato numeric(10,2) NOT NULL DEFAULT 0,
  data_vencimento date NOT NULL,
  cidade text NOT NULL,
  status_pagamento boolean DEFAULT false,
  observacoes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar índice para otimizar buscas por CPF
CREATE INDEX IF NOT EXISTS idx_contratos_cpf ON contratos(cpf_cliente);

-- Habilitar RLS
ALTER TABLE contratos ENABLE ROW LEVEL SECURITY;

-- Política: Qualquer pessoa pode consultar contratos (área do cliente)
CREATE POLICY "Permitir consulta pública de contratos"
  ON contratos
  FOR SELECT
  TO public
  USING (true);

-- Política: Apenas usuários autenticados podem inserir contratos
CREATE POLICY "Usuários autenticados podem inserir contratos"
  ON contratos
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Política: Apenas usuários autenticados podem atualizar contratos
CREATE POLICY "Usuários autenticados podem atualizar contratos"
  ON contratos
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Política: Apenas usuários autenticados podem excluir contratos
CREATE POLICY "Usuários autenticados podem excluir contratos"
  ON contratos
  FOR DELETE
  TO authenticated
  USING (true);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_contratos_updated_at ON contratos;
CREATE TRIGGER update_contratos_updated_at
  BEFORE UPDATE ON contratos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();