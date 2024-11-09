// src/enums/DocumentStatus.ts

// Criação do Documento: Quando o documento é criado -> Pending.
// Preparação para Hashing: Quando o documento tem tudo necessário para o hashing -> ReadyForHashing.
// Hashing: Quando o hash é gerado -> HashingComplete.
// Envio para Blockchain: Quando o hash é enviado e aguarda confirmação -> WaitingForBlockchainConfirmation.
// Confirmação na Blockchain: Quando a transação é confirmada -> OnBlockchain.
// Aguardando Assinaturas: Quando o documento está pronto para receber assinaturas -> AwaitingSignatures.
// Assinatura Parcial: Quando alguns, mas não todos os participantes, assinaram -> PartiallySigned.
// Assinatura Completa: Quando todos assinam -> FullySigned.
// Rejeição: Se algum participante rejeita ou o documento é invalidado -> Rejected.
// Arquivamento: Quando o documento é movido para o histórico -> Archived.

export enum DocumentStatus {
  Pending = "Pending",
  WaitingForBlockchainConfirmation = "Waiting for Blockchain Confirmation",
  OnBlockchain = "On Blockchain",
  AwaitingSignatures = "Awaiting Signatures",
  PartiallySigned = "Partially Signed",
  FullySigned = "Fully Signed",
  Rejected = "Rejected",
  Archived = "Archived",
}
