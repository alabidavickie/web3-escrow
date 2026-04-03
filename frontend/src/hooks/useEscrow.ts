import { useState, useCallback } from 'react';
import { CallData, uint256 } from 'starknet';
import { useProvider } from '@starknet-react/core';
import { useWallet } from './useWallet';
import { ESCROW_ADDRESS, STRK_ADDRESS } from '../lib/contracts';

// Standard ERC20 approve ABI (minimal)
const ERC20_APPROVE_ABI = [
  {
    type: 'function',
    name: 'approve',
    inputs: [
      { name: 'spender', type: 'core::starknet::contract_address::ContractAddress' },
      { name: 'amount',  type: 'core::integer::u256' },
    ],
    outputs: [{ type: 'core::bool' }],
    state_mutability: 'external',
  },
] as const;

// ---- Helpers ----------------------------------------------------------------

function toU256Calldata(value: bigint): string[] {
  const { low, high } = uint256.bnToUint256(value);
  return [low.toString(), high.toString()];
}

/** Encode an ASCII string (≤31 chars) to a felt252 hex string. */
function encodeShortString(str: string): string {
  if (str.length > 31) throw new Error(`"${str}" exceeds 31-char felt252 limit`);
  let hex = '';
  for (let i = 0; i < str.length; i++) hex += str.charCodeAt(i).toString(16).padStart(2, '0');
  return '0x' + hex;
}

// ---- Types ------------------------------------------------------------------

export interface CreateContractParams {
  freelancer: string;
  token?: string; // defaults to STRK
  milestones: { description: string; amount: bigint }[];
}

export interface CreateAndDepositResult {
  txHash: string;
  contractId: bigint;
}

export interface UseEscrowReturn {
  createContract:    (params: CreateContractParams) => Promise<string | null | false>;
  createAndDeposit:  (params: CreateContractParams) => Promise<CreateAndDepositResult | null>;
  depositFunds:      (contractId: bigint, tokenAddress: string, amount: bigint) => Promise<boolean>;
  submitMilestone:   (contractId: bigint, milestoneIndex: number, proofHash: string) => Promise<boolean>;
  approveMilestone:  (contractId: bigint, milestoneIndex: number) => Promise<boolean>;
  raiseDispute:      (contractId: bigint, milestoneIndex: number) => Promise<boolean>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

// ---- Hook -------------------------------------------------------------------

export function useEscrow(): UseEscrowReturn {
  const { wallet } = useWallet();
  const { provider } = useProvider();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  function handleError(err: unknown): null | false {
    const msg = err instanceof Error ? err.message : String(err);
    setError(msg);
    return null;
  }

  // --------------------------------------------------------------------------
  // create_contract
  // --------------------------------------------------------------------------
  const createContract = useCallback(
    async ({ freelancer, token = STRK_ADDRESS, milestones }: CreateContractParams) => {
      if (!wallet?.raw) { setError('Wallet not connected'); return null; }
      setLoading(true);
      setError(null);
      try {
        const totalAmount = milestones.reduce((s, m) => s + m.amount, 0n);

        // Span<felt252>: [len, ...items]
        const descCalldata = [
          milestones.length.toString(),
          ...milestones.map(m => encodeShortString(m.description)),
        ];

        // Span<u256>: [len, low0, high0, low1, high1, ...]
        const amtCalldata = [
          milestones.length.toString(),
          ...milestones.flatMap(m => toU256Calldata(m.amount)),
        ];

        const calldata = CallData.compile([
          freelancer,
          token,
          ...toU256Calldata(totalAmount),
          ...descCalldata,
          ...amtCalldata,
        ]);

        const result = await wallet.raw.execute(
          [{ contractAddress: ESCROW_ADDRESS, entrypoint: 'create_contract', calldata }],
        );

        // The return value is a u256 contract_id — extract from events if needed.
        // For now return the tx hash so the caller can wait on-chain.
        return result?.transaction_hash ?? null;
      } catch (err) {
        return handleError(err);
      } finally {
        setLoading(false);
      }
    },
    [wallet],
  );

  // --------------------------------------------------------------------------
  // deposit_funds  (atomically: approve + deposit in one multicall)
  // --------------------------------------------------------------------------
  const depositFunds = useCallback(
    async (contractId: bigint, tokenAddress: string, amount: bigint): Promise<boolean> => {
      if (!wallet?.raw) { setError('Wallet not connected'); return false; }
      setLoading(true);
      setError(null);
      try {
        const approveCalldata = CallData.compile([
          ESCROW_ADDRESS,
          ...toU256Calldata(amount),
        ]);

        const depositCalldata = CallData.compile([
          ...toU256Calldata(contractId),
        ]);

        await wallet.raw.execute(
          [
            {
              contractAddress: tokenAddress,
              entrypoint: 'approve',
              calldata: approveCalldata,
            },
            {
              contractAddress: ESCROW_ADDRESS,
              entrypoint: 'deposit_funds',
              calldata: depositCalldata,
            },
          ],
        );
        return true;
      } catch (err) {
        handleError(err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [wallet],
  );

  // --------------------------------------------------------------------------
  // submit_milestone
  // --------------------------------------------------------------------------
  const submitMilestone = useCallback(
    async (contractId: bigint, milestoneIndex: number, proofHash: string): Promise<boolean> => {
      if (!wallet?.raw) { setError('Wallet not connected'); return false; }
      setLoading(true);
      setError(null);
      try {
        const calldata = CallData.compile([
          ...toU256Calldata(contractId),
          milestoneIndex.toString(),
          proofHash,
        ]);

        await wallet.raw.execute(
          [{ contractAddress: ESCROW_ADDRESS, entrypoint: 'submit_milestone', calldata }],
        );
        return true;
      } catch (err) {
        handleError(err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [wallet],
  );

  // --------------------------------------------------------------------------
  // approve_milestone
  // --------------------------------------------------------------------------
  const approveMilestone = useCallback(
    async (contractId: bigint, milestoneIndex: number): Promise<boolean> => {
      if (!wallet?.raw) { setError('Wallet not connected'); return false; }
      setLoading(true);
      setError(null);
      try {
        const calldata = CallData.compile([
          ...toU256Calldata(contractId),
          milestoneIndex.toString(),
        ]);

        await wallet.raw.execute(
          [{ contractAddress: ESCROW_ADDRESS, entrypoint: 'approve_milestone', calldata }],
        );
        return true;
      } catch (err) {
        handleError(err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [wallet],
  );

  // --------------------------------------------------------------------------
  // raise_dispute
  // --------------------------------------------------------------------------
  const raiseDispute = useCallback(
    async (contractId: bigint, milestoneIndex: number): Promise<boolean> => {
      if (!wallet?.raw) { setError('Wallet not connected'); return false; }
      setLoading(true);
      setError(null);
      try {
        const calldata = CallData.compile([
          ...toU256Calldata(contractId),
          milestoneIndex.toString(),
        ]);

        await wallet.raw.execute(
          [{ contractAddress: ESCROW_ADDRESS, entrypoint: 'raise_dispute', calldata }],
        );
        return true;
      } catch (err) {
        handleError(err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [wallet],
  );

  // --------------------------------------------------------------------------
  // createAndDeposit — one atomic multicall: approve + create_contract + deposit
  // Reads get_contract_count() first to predict the assigned contract_id.
  // --------------------------------------------------------------------------
  const createAndDeposit = useCallback(
    async ({ freelancer, token = STRK_ADDRESS, milestones }: CreateContractParams): Promise<CreateAndDepositResult | null> => {
      if (!wallet?.raw) { setError('Wallet not connected'); return null; }
      setLoading(true);
      setError(null);
      try {
        // 1. Predict contract_id from current count (used for deposit_funds in same multicall)
        const countResult = await provider.callContract({
          contractAddress: ESCROW_ADDRESS,
          entrypoint: 'get_contract_count',
          calldata: [],
        });
        const predictedId = BigInt(countResult[0]);

        const totalAmount = milestones.reduce((s, m) => s + m.amount, 0n);

        const descCalldata = [
          milestones.length.toString(),
          ...milestones.map(m => encodeShortString(m.description)),
        ];
        const amtCalldata = [
          milestones.length.toString(),
          ...milestones.flatMap(m => toU256Calldata(m.amount)),
        ];

        // 2. Three calls in one tx: ERC20 approve → create_contract → deposit_funds
        const result = await wallet.raw.execute(
          [
            {
              contractAddress: token,
              entrypoint: 'approve',
              calldata: CallData.compile([ESCROW_ADDRESS, ...toU256Calldata(totalAmount)]),
            },
            {
              contractAddress: ESCROW_ADDRESS,
              entrypoint: 'create_contract',
              calldata: CallData.compile([
                freelancer, token,
                ...toU256Calldata(totalAmount),
                ...descCalldata,
                ...amtCalldata,
              ]),
            },
            {
              contractAddress: ESCROW_ADDRESS,
              entrypoint: 'deposit_funds',
              calldata: CallData.compile([...toU256Calldata(predictedId)]),
            },
          ],
        );

        const txHash = result?.transaction_hash ?? '';

        // 3. Wait for receipt and read the actual contract_id from the ContractCreated event.
        //    Event keys layout: [selector, contract_id.low, contract_id.high, client, freelancer]
        //    This avoids the race-condition of relying solely on the predicted count.
        let contractId = predictedId;
        try {
          const receipt = await provider.waitForTransaction(txHash);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const events: Array<{ from_address: string; keys: string[] }> = (receipt as any).events ?? [];
          const escrowEvent = events.find(
            e => e.from_address.toLowerCase() === ESCROW_ADDRESS.toLowerCase() && e.keys.length >= 3,
          );
          if (escrowEvent) {
            // keys[0] = event selector, keys[1] = contract_id.low, keys[2] = contract_id.high
            contractId = uint256.uint256ToBN({
              low: BigInt(escrowEvent.keys[1]),
              high: BigInt(escrowEvent.keys[2]),
            });
          }
        } catch {
          // Receipt parsing failed — fall back to predicted ID
        }

        return { txHash, contractId };
      } catch (err) {
        handleError(err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [wallet],
  );

  return {
    createContract,
    createAndDeposit,
    depositFunds,
    submitMilestone,
    approveMilestone,
    raiseDispute,
    loading,
    error,
    clearError: useCallback(() => setError(null), []),
  };
}

// Re-export for convenience
export { ERC20_APPROVE_ABI };
