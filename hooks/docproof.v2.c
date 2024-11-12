#include "hookapi.h"

/**
 * Memo ref from: https://gist.github.com/WietseWind/e8e1510fe114ae76cfac1b65b06b129f
 */

#define PARAM_REGISTER "REGISTER"
#define PARAM_SIGN "SIGN"

#define MAX_MEMO_SIZE 4096

typedef struct DPSignature
{
    uint8_t signer_acc[20];
    uint8_t doc_hash[32];
    uint64_t timestamp;
} Signature;

int64_t hook(int32_t reserved)
{
    TRACESTR("Docproof.c: Called.");

    if (otxn_type() != ttINVOKE)
    {
        accept(SBUF("DP: Txn is not INVOKE. Passing txn."), __LINE__);
        return 0;
    }

    Signature sig;

    uint8_t param_buffer[9];
    uint8_t memos[MAX_MEMO_SIZE];

    int64_t param_size = otxn_param(SBUF(param_buffer), "operation", 9);

    if (param_size < 0)
        rollback(SBUF("DP: Operation parameter not found"), 1);

    TRACESTR(param_buffer);

    int64_t memos_len = otxn_field(SBUF(memos), sfMemos);

    if (memos_len <= 0)
        accept(SBUF("DP: Incoming txn without memo, passing."), 0);

    if (memos_len > 0)
    {
        int64_t memo_lookup = sto_subarray(memos, memos_len, 0);
        uint8_t *memo_ptr = SUB_OFFSET(memo_lookup) + memos;
        uint32_t memo_len = SUB_LENGTH(memo_lookup);

        memo_lookup = sto_subfield(memo_ptr, memo_len, sfMemo);
        memo_ptr = SUB_OFFSET(memo_lookup) + memo_ptr;
        memo_len = SUB_LENGTH(memo_lookup);

        if (memo_lookup < 0)
            rollback(SBUF("DP: Incoming txn had a blank sfMemos, abort."), 1);

        int64_t format_lookup = sto_subfield(memo_ptr, memo_len, sfMemoFormat);
        uint8_t *format_ptr = SUB_OFFSET(format_lookup) + memo_ptr;
        uint32_t format_len = SUB_LENGTH(format_lookup);

        int is_text_hex = 0;
        BUFFER_EQUAL_STR_GUARD(is_text_hex, format_ptr, format_len, "text/hex", 1);
        if (!is_text_hex)
            accept(SBUF("DP: Memo is an invalid format. Passing txn."), __LINE__);

        int64_t data_lookup = sto_subfield(memo_ptr, memo_len, sfMemoData);
        uint8_t *data_ptr = SUB_OFFSET(data_lookup) + memo_ptr;
        uint32_t data_len = SUB_LENGTH(data_lookup);

        if (data_len > MAX_MEMO_SIZE)
            rollback(SBUF("DP: Memo too large (4kib max)."), 4);

        for (int i = 0; GUARD(32), i < 32; ++i)
            sig.doc_hash[i] = data_ptr[i];

        TRACEHEX(sig.doc_hash);
    }

    uint8_t state_key_len = 52;
    uint8_t state_key[state_key_len], state_key_hex[32];

    int64_t signer_acc_size = otxn_field(SBUF(sig.signer_acc), sfAccount);

    for (int i = 0; GUARD(32), i < 32; i++)
        state_key[i] = sig.doc_hash[i];

    for (int i = 0; GUARD(20), i < 20; i++)
        state_key[i + 32] = sig.signer_acc[i];

    if (util_sha512h(SBUF(state_key_hex), SBUF(state_key)) < 0)
        rollback(SBUF("DP: Could not compute sha512 over the submitted txn."), __LINE__);

    int64_t existing = state(SVAR(sig), SBUF(state_key_hex));
    if (existing > 0)
    {
        TRACEHEX(sig.doc_hash);
        TRACEHEX(sig.signer_acc);
        rollback(SBUF("DP: Document already signed."), __LINE__);
    }

    TRACEHEX(sig.doc_hash);
    TRACEHEX(sig.signer_acc);

    if (state_set(SVAR(sig), SBUF(state_key_hex)) < 0)
        rollback(SBUF("DP: Error registering signature"), __LINE__);

    accept(SBUF("DP: Document signed successfully"), 0);

    _g(1, 1);

    return 0;
}
