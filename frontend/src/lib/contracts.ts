// =============================================================================
// EscrowHub — deployed on Starknet Sepolia
// declare tx : 0x0713a14a187ebfcbc9b5e573aa1ebc92e9e98e020d3b1fa57d6fdec337bf87a0
// deploy  tx : 0x004eccb6011561a60b5d81959f580a5f83b1662f92f69ed2dd2672ee652fedcd
// class hash : 0x06c86aa996f59b726d482d3be99bd2f98d2ca96cad6b81dd87b8e10080fbaaa9
// =============================================================================

export const ESCROW_ADDRESS =
  '0x021ea1a1c14abd5d74634aa08d52e8d81f34f9dfcc14d2a42466d7167b4a7743';

// STRK token on Sepolia (used as default payment token)
export const STRK_ADDRESS =
  '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d';

// ETH on Sepolia
export const ETH_ADDRESS =
  '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7';

// USDC on Sepolia — bridged via StarkGate, 6 decimals
// source: github.com/starknet-io/starknet-addresses/blob/master/bridged_tokens/sepolia.json
export const USDC_ADDRESS =
  '0x053b40a647cedfca6ca84f542a0fe36736031905a9639a7f19a3c1e66bfd5080';

// Token metadata for UI
export const SUPPORTED_TOKENS = [
  { address: STRK_ADDRESS, symbol: 'STRK', decimals: 18 },
  { address: USDC_ADDRESS, symbol: 'USDC', decimals: 6  },
] as const;

export type SupportedToken = typeof SUPPORTED_TOKENS[number];

// =============================================================================
// TypeScript types mirroring the Cairo structs
// =============================================================================

export type ContractStatus = 0 | 1 | 2; // Active | Completed | Disputed
export type MilestoneStatus = 0 | 1 | 2 | 3; // Pending | Submitted | Approved | Disputed

export interface EscrowContractData {
  client: string;
  freelancer: string;
  token: string;
  total_amount: bigint;
  deposited: boolean;
  status: ContractStatus;
  milestone_count: number;
  created_at: bigint;
}

export interface MilestoneData {
  description: string; // decoded from felt252
  amount: bigint;
  status: MilestoneStatus;
  proof_hash: string;
}

// =============================================================================
// ABI — verbatim from target/dev/escrow_hub_EscrowHub.contract_class.json
// =============================================================================

export const ESCROW_ABI = [
  {
    type: 'impl',
    name: 'EscrowHubImpl',
    interface_name: 'escrow_hub::escrow_hub::IEscrowHub',
  },
  {
    type: 'struct',
    name: 'core::integer::u256',
    members: [
      { name: 'low', type: 'core::integer::u128' },
      { name: 'high', type: 'core::integer::u128' },
    ],
  },
  {
    type: 'struct',
    name: 'core::array::Span::<core::felt252>',
    members: [{ name: 'snapshot', type: '@core::array::Array::<core::felt252>' }],
  },
  {
    type: 'struct',
    name: 'core::array::Span::<core::integer::u256>',
    members: [{ name: 'snapshot', type: '@core::array::Array::<core::integer::u256>' }],
  },
  {
    type: 'enum',
    name: 'core::bool',
    variants: [
      { name: 'False', type: '()' },
      { name: 'True', type: '()' },
    ],
  },
  {
    type: 'struct',
    name: 'escrow_hub::escrow_hub::EscrowContract',
    members: [
      { name: 'client',           type: 'core::starknet::contract_address::ContractAddress' },
      { name: 'freelancer',       type: 'core::starknet::contract_address::ContractAddress' },
      { name: 'token',            type: 'core::starknet::contract_address::ContractAddress' },
      { name: 'total_amount',     type: 'core::integer::u256' },
      { name: 'deposited',        type: 'core::bool' },
      { name: 'status',           type: 'core::integer::u8' },
      { name: 'milestone_count',  type: 'core::integer::u32' },
      { name: 'created_at',       type: 'core::integer::u64' },
    ],
  },
  {
    type: 'struct',
    name: 'escrow_hub::escrow_hub::Milestone',
    members: [
      { name: 'description', type: 'core::felt252' },
      { name: 'amount',      type: 'core::integer::u256' },
      { name: 'status',      type: 'core::integer::u8' },
      { name: 'proof_hash',  type: 'core::felt252' },
    ],
  },
  {
    type: 'interface',
    name: 'escrow_hub::escrow_hub::IEscrowHub',
    items: [
      {
        type: 'function',
        name: 'create_contract',
        inputs: [
          { name: 'freelancer',              type: 'core::starknet::contract_address::ContractAddress' },
          { name: 'token',                   type: 'core::starknet::contract_address::ContractAddress' },
          { name: 'total_amount',            type: 'core::integer::u256' },
          { name: 'milestone_descriptions',  type: 'core::array::Span::<core::felt252>' },
          { name: 'milestone_amounts',       type: 'core::array::Span::<core::integer::u256>' },
        ],
        outputs: [{ type: 'core::integer::u256' }],
        state_mutability: 'external',
      },
      {
        type: 'function',
        name: 'deposit_funds',
        inputs: [{ name: 'contract_id', type: 'core::integer::u256' }],
        outputs: [],
        state_mutability: 'external',
      },
      {
        type: 'function',
        name: 'submit_milestone',
        inputs: [
          { name: 'contract_id',     type: 'core::integer::u256' },
          { name: 'milestone_index', type: 'core::integer::u32' },
          { name: 'proof_hash',      type: 'core::felt252' },
        ],
        outputs: [],
        state_mutability: 'external',
      },
      {
        type: 'function',
        name: 'approve_milestone',
        inputs: [
          { name: 'contract_id',     type: 'core::integer::u256' },
          { name: 'milestone_index', type: 'core::integer::u32' },
        ],
        outputs: [],
        state_mutability: 'external',
      },
      {
        type: 'function',
        name: 'raise_dispute',
        inputs: [
          { name: 'contract_id',     type: 'core::integer::u256' },
          { name: 'milestone_index', type: 'core::integer::u32' },
        ],
        outputs: [],
        state_mutability: 'external',
      },
      {
        type: 'function',
        name: 'get_contract',
        inputs: [{ name: 'contract_id', type: 'core::integer::u256' }],
        outputs: [{ type: 'escrow_hub::escrow_hub::EscrowContract' }],
        state_mutability: 'view',
      },
      {
        type: 'function',
        name: 'get_milestone',
        inputs: [
          { name: 'contract_id',     type: 'core::integer::u256' },
          { name: 'milestone_index', type: 'core::integer::u32' },
        ],
        outputs: [{ type: 'escrow_hub::escrow_hub::Milestone' }],
        state_mutability: 'view',
      },
      {
        type: 'function',
        name: 'get_contract_count',
        inputs: [],
        outputs: [{ type: 'core::integer::u256' }],
        state_mutability: 'view',
      },
    ],
  },
  { type: 'constructor', name: 'constructor', inputs: [] },
  {
    type: 'event',
    name: 'escrow_hub::escrow_hub::EscrowHub::ContractCreated',
    kind: 'struct',
    members: [
      { name: 'contract_id',    type: 'core::integer::u256',                                   kind: 'key' },
      { name: 'client',         type: 'core::starknet::contract_address::ContractAddress',     kind: 'key' },
      { name: 'freelancer',     type: 'core::starknet::contract_address::ContractAddress',     kind: 'key' },
      { name: 'token',          type: 'core::starknet::contract_address::ContractAddress',     kind: 'data' },
      { name: 'total_amount',   type: 'core::integer::u256',                                   kind: 'data' },
      { name: 'milestone_count',type: 'core::integer::u32',                                    kind: 'data' },
      { name: 'created_at',     type: 'core::integer::u64',                                    kind: 'data' },
    ],
  },
  {
    type: 'event',
    name: 'escrow_hub::escrow_hub::EscrowHub::FundsDeposited',
    kind: 'struct',
    members: [
      { name: 'contract_id', type: 'core::integer::u256',                               kind: 'key' },
      { name: 'client',      type: 'core::starknet::contract_address::ContractAddress', kind: 'key' },
      { name: 'token',       type: 'core::starknet::contract_address::ContractAddress', kind: 'data' },
      { name: 'amount',      type: 'core::integer::u256',                               kind: 'data' },
    ],
  },
  {
    type: 'event',
    name: 'escrow_hub::escrow_hub::EscrowHub::MilestoneSubmitted',
    kind: 'struct',
    members: [
      { name: 'contract_id',     type: 'core::integer::u256',                               kind: 'key' },
      { name: 'milestone_index', type: 'core::integer::u32',                                kind: 'key' },
      { name: 'freelancer',      type: 'core::starknet::contract_address::ContractAddress', kind: 'data' },
      { name: 'proof_hash',      type: 'core::felt252',                                     kind: 'data' },
    ],
  },
  {
    type: 'event',
    name: 'escrow_hub::escrow_hub::EscrowHub::MilestoneApproved',
    kind: 'struct',
    members: [
      { name: 'contract_id',     type: 'core::integer::u256',                               kind: 'key' },
      { name: 'milestone_index', type: 'core::integer::u32',                                kind: 'key' },
      { name: 'client',          type: 'core::starknet::contract_address::ContractAddress', kind: 'data' },
      { name: 'amount',          type: 'core::integer::u256',                               kind: 'data' },
    ],
  },
  {
    type: 'event',
    name: 'escrow_hub::escrow_hub::EscrowHub::DisputeRaised',
    kind: 'struct',
    members: [
      { name: 'contract_id',     type: 'core::integer::u256', kind: 'key' },
      { name: 'milestone_index', type: 'core::integer::u32',  kind: 'key' },
      { name: 'raised_by',       type: 'core::starknet::contract_address::ContractAddress', kind: 'data' },
    ],
  },
  {
    type: 'event',
    name: 'escrow_hub::escrow_hub::EscrowHub::Event',
    kind: 'enum',
    variants: [
      { name: 'ContractCreated',   type: 'escrow_hub::escrow_hub::EscrowHub::ContractCreated',   kind: 'nested' },
      { name: 'FundsDeposited',    type: 'escrow_hub::escrow_hub::EscrowHub::FundsDeposited',    kind: 'nested' },
      { name: 'MilestoneSubmitted',type: 'escrow_hub::escrow_hub::EscrowHub::MilestoneSubmitted',kind: 'nested' },
      { name: 'MilestoneApproved', type: 'escrow_hub::escrow_hub::EscrowHub::MilestoneApproved', kind: 'nested' },
      { name: 'DisputeRaised',     type: 'escrow_hub::escrow_hub::EscrowHub::DisputeRaised',     kind: 'nested' },
    ],
  },
] as const;
