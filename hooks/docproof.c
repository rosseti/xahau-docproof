/**
 * docproof.c - Secure document signing on Xahau Blockchain Network.
 *
 * Author: Andrei Rosseti
 * Date: 12 Nov 2024
 *
 */

#include "hookapi.h"

#define DONE(x) accept(SBUF(x), __LINE__)
#define NOPE(x) rollback(SBUF(x), __LINE__)

// clang-format off
uint8_t txn[238] =
{
/* size,upto */
/* 3,   0,   tt = Payment           */   0x12U, 0x00U, 0x00U,
/* 5,   3,   flags                  */   0x22U, 0x00U, 0x00U, 0x00U, 0x00U,
/* 5,   8,   sequence               */   0x24U, 0x00U, 0x00U, 0x00U, 0x00U,
/* 6,   13,  firstledgersequence    */   0x20U, 0x1AU, 0x00U, 0x00U, 0x00U, 0x00U,
/* 6,   19,  lastledgersequence     */   0x20U, 0x1BU, 0x00U, 0x00U, 0x00U, 0x00U,
/* 9,   25,  amount                 */   0x61U, 0x99U, 0x99U, 0x99U, 0x99U, 0x99U, 0x99U, 0x99U, 0x99U,
/* 9,   34,  fee                    */   0x68U, 0x40U, 0x00U, 0x00U, 0x00U, 0x00U, 0x00U, 0x00U, 0x00U,
/* 35,  43,  signingpubkey          */   0x73U, 0x21U, 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
/* 22,  78,  account                */   0x81U, 0x14U, 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
/* 22,  100, destination            */   0x83U, 0x14U, 0x78U, 0x9DU, 0x7CU, 0xA7U, 0x4EU, 0x1FU, 0xB7U, 0x86U, 0x94U, 0x94U, 0x76U, 0x47U, 0x3BU, 0xD1U, 0x1CU, 0x0AU, 0xE0U, 0xF1U, 0xC3U, 0xDAU,
/* 116, 122  emit details           */ 
/* 0,   238                         */ 
};
// clang-format on

#define FLS_OUT (txn + 15U)
#define LLS_OUT (txn + 21U)
#define FEE_OUT (txn + 35U)
#define AMOUNT_OUT (txn + 26U)
#define ACC_OUT (txn + 80U)
#define EMIT_OUT (txn + 122U)

int64_t hook(int32_t reserved)
{
    typedef struct DPSignature {
        uint8_t signer_acc[20];
        uint8_t doc_hash[32];
        uint8_t doc_id[32];
    } Signature;    
    Signature sig;

    otxn_field(SBUF(sig.signer_acc), sfAccount);
    hook_account(ACC_OUT, 20);
    if(BUFFER_EQUAL_20(sig.signer_acc, ACC_OUT))
        DONE("DP: Outgoing Transaction.");
    
    if (otxn_param(SBUF(sig.doc_id), "DocId", 5) < 32)
        NOPE("DP: Incoming txn without docId, bailing.");

    if (otxn_param(SBUF(sig.doc_hash), "DocHash", 7) < 32)
        NOPE("DP: Incoming txn without dochash, bailing.");

    uint8_t state_key_hex[32];
    if (util_sha512h(SBUF(state_key_hex), SVAR(sig)) < 0)
        NOPE("DP: Could not compute sha512 over the submitted txn.");

    if (state(SVAR(sig), SBUF(state_key_hex)) > 0)
        NOPE("DP: Document already signed.");

    uint8_t amount[8];
    if(otxn_field(SBUF(amount), sfAmount) != 8)
        NOPE("DP: Non-XAH Payment Rejected.");

    uint64_t otxn_drops = AMOUNT_TO_DROPS(amount);
    int64_t amount_xfl = float_set(-6, otxn_drops);

    if(float_compare(amount_xfl, 6089866696204910592, COMPARE_LESS) == 1)
        NOPE("DP: 1 XAH per document signing.");    

    if (state_set(SVAR(sig), SBUF(state_key_hex)) < 0)
        NOPE("DP: Error registering signature.");

    int64_t forward_amt =   float_sum(amount_xfl, float_negate(6071852297695428608));
    {
        uint64_t drops = float_int(forward_amt, 6, 1); 
        uint8_t *b = AMOUNT_OUT; 
        *b++ = 0b01000000 + ((drops >> 56) & 0b00111111); 
        *b++ = (drops >> 48) & 0xFFU; 
        *b++ = (drops >> 40) & 0xFFU; 
        *b++ = (drops >> 32) & 0xFFU; 
        *b++ = (drops >> 24) & 0xFFU; 
        *b++ = (drops >> 16) & 0xFFU; 
        *b++ = (drops >> 8) & 0xFFU; 
        *b++ = (drops >> 0) & 0xFFU; 
    }           
    etxn_reserve(1);
    uint32_t current_ledger = ledger_seq();
    uint32_t fls = current_ledger + 1;
    uint32_t lls = fls + 4;
    *((uint32_t *)(FLS_OUT)) = FLIP_ENDIAN(fls);
    *((uint32_t *)(LLS_OUT)) = FLIP_ENDIAN(lls);
    etxn_details(EMIT_OUT, 116U);
    {
        int64_t fee = etxn_fee_base(SBUF(txn));
        uint8_t *b = FEE_OUT;
        *b++ = 0b01000000 + ((fee >> 56) & 0b00111111);
        *b++ = (fee >> 48) & 0xFFU;
        *b++ = (fee >> 40) & 0xFFU;
        *b++ = (fee >> 32) & 0xFFU;
        *b++ = (fee >> 24) & 0xFFU;
        *b++ = (fee >> 16) & 0xFFU;
        *b++ = (fee >> 8) & 0xFFU;
        *b++ = (fee >> 0) & 0xFFU;
    }
    uint8_t emithash[32];
    if (emit(SBUF(emithash), SBUF(txn)) != 32)
        NOPE("DP: Failed To Emit.");        

    DONE("DP: Document signed successfully.");
    _g(1, 1);
    return 0;
}