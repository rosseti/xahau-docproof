// src/enums/DocumentStatus.ts

// Criação do Documento: Quando o documento é criado -> Pending.
// Aguardando Assinaturas: Quando o documento está pronto para receber assinaturas -> AwaitingSignatures.
// Assinatura Parcial: Quando alguns, mas não todos os participantes, assinaram -> PartiallySigned.
// Assinatura Completa: Quando todos assinam -> FullySigned.
// Rejeição: Se algum participante rejeita ou o documento é invalidado -> Rejected.
// Arquivamento: Quando o documento é movido para o histórico -> Archived.

export enum DocumentStatus {
  Pending = "Pending",
  AwaitingSignatures = "Awaiting Signatures",
  PartiallySigned = "Partially Signed",
  FullySigned = "Fully Signed",
  Rejected = "Rejected",
  Archived = "Archived",
}
