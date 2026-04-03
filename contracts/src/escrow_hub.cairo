use starknet::ContractAddress;

// ============================================================================
// Structs (defined outside module for interface visibility)
// ============================================================================

#[derive(Drop, Serde, starknet::Store)]
pub struct EscrowContract {
    pub client: ContractAddress,
    pub freelancer: ContractAddress,
    pub token: ContractAddress,
    pub total_amount: u256,
    pub deposited: bool,
    pub status: u8,          // 0=Active, 1=Completed, 2=Disputed
    pub milestone_count: u32,
    pub created_at: u64,
}

#[derive(Drop, Serde, starknet::Store)]
pub struct Milestone {
    pub description: felt252,
    pub amount: u256,
    pub status: u8,          // 0=Pending, 1=Submitted, 2=Approved, 3=Disputed
    pub proof_hash: felt252,
}

// ============================================================================
// Interface
// ============================================================================

#[starknet::interface]
pub trait IEscrowHub<TContractState> {
    // --- Write functions ---
    fn create_contract(
        ref self: TContractState,
        freelancer: ContractAddress,
        token: ContractAddress,
        total_amount: u256,
        milestone_descriptions: Span<felt252>,
        milestone_amounts: Span<u256>,
    ) -> u256;

    fn deposit_funds(ref self: TContractState, contract_id: u256);

    fn submit_milestone(
        ref self: TContractState,
        contract_id: u256,
        milestone_index: u32,
        proof_hash: felt252,
    );

    fn approve_milestone(ref self: TContractState, contract_id: u256, milestone_index: u32);

    fn raise_dispute(ref self: TContractState, contract_id: u256, milestone_index: u32);

    // --- Read functions ---
    fn get_contract(self: @TContractState, contract_id: u256) -> EscrowContract;
    fn get_milestone(self: @TContractState, contract_id: u256, milestone_index: u32) -> Milestone;
    fn get_contract_count(self: @TContractState) -> u256;
}

// ============================================================================
// Contract Implementation
// ============================================================================

#[starknet::contract]
pub mod EscrowHub {
    use starknet::ContractAddress;
    use starknet::get_caller_address;
    use starknet::get_block_timestamp;
    use starknet::storage::*;
    use openzeppelin_token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};
    use super::{EscrowContract, Milestone};

    // ========================================================================
    // Storage
    // ========================================================================

    #[storage]
    struct Storage {
        /// Total number of escrow contracts created.
        contract_count: u256,
        /// Mapping: contract_id -> EscrowContract
        contracts: Map<u256, EscrowContract>,
        /// Mapping: (contract_id, milestone_index) -> Milestone
        milestones: Map<u256, Map<u32, Milestone>>,
    }

    // ========================================================================
    // Events
    // ========================================================================

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        ContractCreated: ContractCreated,
        FundsDeposited: FundsDeposited,
        MilestoneSubmitted: MilestoneSubmitted,
        MilestoneApproved: MilestoneApproved,
        DisputeRaised: DisputeRaised,
    }

    #[derive(Drop, starknet::Event)]
    pub struct ContractCreated {
        #[key]
        pub contract_id: u256,
        #[key]
        pub client: ContractAddress,
        #[key]
        pub freelancer: ContractAddress,
        pub token: ContractAddress,
        pub total_amount: u256,
        pub milestone_count: u32,
        pub created_at: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct FundsDeposited {
        #[key]
        pub contract_id: u256,
        #[key]
        pub client: ContractAddress,
        pub token: ContractAddress,
        pub amount: u256,
    }

    #[derive(Drop, starknet::Event)]
    pub struct MilestoneSubmitted {
        #[key]
        pub contract_id: u256,
        #[key]
        pub milestone_index: u32,
        pub freelancer: ContractAddress,
        pub proof_hash: felt252,
    }

    #[derive(Drop, starknet::Event)]
    pub struct MilestoneApproved {
        #[key]
        pub contract_id: u256,
        #[key]
        pub milestone_index: u32,
        pub client: ContractAddress,
        pub amount: u256,
    }

    #[derive(Drop, starknet::Event)]
    pub struct DisputeRaised {
        #[key]
        pub contract_id: u256,
        #[key]
        pub milestone_index: u32,
        pub raised_by: ContractAddress,
    }

    // ========================================================================
    // Constructor
    // ========================================================================

    #[constructor]
    fn constructor(ref self: ContractState) {
        self.contract_count.write(0);
    }

    // ========================================================================
    // External Implementation
    // ========================================================================

    #[abi(embed_v0)]
    impl EscrowHubImpl of super::IEscrowHub<ContractState> {
        // --------------------------------------------------------------------
        // create_contract
        // Creates a new escrow with milestones. Called by the client.
        // The sum of milestone amounts must equal total_amount.
        // --------------------------------------------------------------------
        fn create_contract(
            ref self: ContractState,
            freelancer: ContractAddress,
            token: ContractAddress,
            total_amount: u256,
            milestone_descriptions: Span<felt252>,
            milestone_amounts: Span<u256>,
        ) -> u256 {
            let caller = get_caller_address();
            let milestone_count: u32 = milestone_descriptions.len();

            // --- Validations ---
            assert!(milestone_count > 0, "Must have at least one milestone");
            assert!(milestone_count == milestone_amounts.len(), "Descriptions and amounts length mismatch");
            assert!(total_amount > 0, "Total amount must be greater than zero");

            // Verify milestone amounts sum to total_amount
            let mut sum: u256 = 0;
            let mut i: u32 = 0;
            while i < milestone_count {
                sum += *milestone_amounts.at(i);
                i += 1;
            };
            assert!(sum == total_amount, "Milestone amounts must sum to total_amount");

            // --- Assign contract ID ---
            let contract_id = self.contract_count.read();
            let timestamp = get_block_timestamp();

            // --- Store escrow contract ---
            let escrow = EscrowContract {
                client: caller,
                freelancer,
                token,
                total_amount,
                deposited: false,
                status: 0,  // Active
                milestone_count,
                created_at: timestamp,
            };
            self.contracts.entry(contract_id).write(escrow);

            // --- Store milestones ---
            let mut j: u32 = 0;
            while j < milestone_count {
                let milestone = Milestone {
                    description: *milestone_descriptions.at(j),
                    amount: *milestone_amounts.at(j),
                    status: 0,  // Pending
                    proof_hash: 0,
                };
                self.milestones.entry(contract_id).entry(j).write(milestone);
                j += 1;
            };

            // --- Increment counter ---
            self.contract_count.write(contract_id + 1);

            // --- Emit event ---
            self.emit(Event::ContractCreated(ContractCreated {
                contract_id,
                client: caller,
                freelancer,
                token,
                total_amount,
                milestone_count,
                created_at: timestamp,
            }));

            contract_id
        }

        // --------------------------------------------------------------------
        // deposit_funds
        // Client deposits the full escrow amount (ERC20 transfer_from).
        // Requires prior approval of this contract by the client.
        // --------------------------------------------------------------------
        fn deposit_funds(ref self: ContractState, contract_id: u256) {
            let caller = get_caller_address();
            let escrow = self.contracts.entry(contract_id).read();

            // --- Validations ---
            assert!(caller == escrow.client, "Only the client can deposit funds");
            assert!(!escrow.deposited, "Funds already deposited");
            assert!(escrow.status == 0, "Contract is not active");

            // --- Transfer tokens from client to this contract ---
            let erc20 = IERC20Dispatcher { contract_address: escrow.token };
            let this_contract = starknet::get_contract_address();
            let success = erc20.transfer_from(caller, this_contract, escrow.total_amount);
            assert!(success, "Token transfer failed");

            // --- Update storage ---
            let updated_escrow = EscrowContract {
                client: escrow.client,
                freelancer: escrow.freelancer,
                token: escrow.token,
                total_amount: escrow.total_amount,
                deposited: true,
                status: escrow.status,
                milestone_count: escrow.milestone_count,
                created_at: escrow.created_at,
            };
            self.contracts.entry(contract_id).write(updated_escrow);

            // --- Emit event ---
            self.emit(Event::FundsDeposited(FundsDeposited {
                contract_id,
                client: caller,
                token: escrow.token,
                amount: escrow.total_amount,
            }));
        }

        // --------------------------------------------------------------------
        // submit_milestone
        // Freelancer submits proof of work for a milestone.
        // --------------------------------------------------------------------
        fn submit_milestone(
            ref self: ContractState,
            contract_id: u256,
            milestone_index: u32,
            proof_hash: felt252,
        ) {
            let caller = get_caller_address();
            let escrow = self.contracts.entry(contract_id).read();

            // --- Validations ---
            assert!(caller == escrow.freelancer, "Only the freelancer can submit milestones");
            assert!(escrow.deposited, "Funds not yet deposited");
            assert!(escrow.status == 0, "Contract is not active");
            assert!(milestone_index < escrow.milestone_count, "Invalid milestone index");

            let milestone = self.milestones.entry(contract_id).entry(milestone_index).read();
            assert!(milestone.status == 0, "Milestone is not in Pending status");

            // --- Update milestone ---
            let updated_milestone = Milestone {
                description: milestone.description,
                amount: milestone.amount,
                status: 1,  // Submitted
                proof_hash,
            };
            self.milestones.entry(contract_id).entry(milestone_index).write(updated_milestone);

            // --- Emit event ---
            self.emit(Event::MilestoneSubmitted(MilestoneSubmitted {
                contract_id,
                milestone_index,
                freelancer: caller,
                proof_hash,
            }));
        }

        // --------------------------------------------------------------------
        // approve_milestone
        // Client approves a submitted milestone, releasing funds to freelancer.
        // If all milestones are approved, the contract status becomes Completed.
        // --------------------------------------------------------------------
        fn approve_milestone(ref self: ContractState, contract_id: u256, milestone_index: u32) {
            let caller = get_caller_address();
            let escrow = self.contracts.entry(contract_id).read();

            // --- Validations ---
            assert!(caller == escrow.client, "Only the client can approve milestones");
            assert!(escrow.deposited, "Funds not yet deposited");
            assert!(escrow.status == 0, "Contract is not active");
            assert!(milestone_index < escrow.milestone_count, "Invalid milestone index");

            let milestone = self.milestones.entry(contract_id).entry(milestone_index).read();
            assert!(milestone.status == 1, "Milestone must be in Submitted status to approve");

            // --- Transfer milestone amount to freelancer ---
            let erc20 = IERC20Dispatcher { contract_address: escrow.token };
            let success = erc20.transfer(escrow.freelancer, milestone.amount);
            assert!(success, "Token transfer to freelancer failed");

            // --- Update milestone ---
            let updated_milestone = Milestone {
                description: milestone.description,
                amount: milestone.amount,
                status: 2,  // Approved
                proof_hash: milestone.proof_hash,
            };
            self.milestones.entry(contract_id).entry(milestone_index).write(updated_milestone);

            // --- Check if all milestones are approved -> mark contract Completed ---
            let mut all_approved: bool = true;
            let mut k: u32 = 0;
            while k < escrow.milestone_count {
                let ms = self.milestones.entry(contract_id).entry(k).read();
                // After this write, the current milestone_index has status 2,
                // so we check for status != 2 on all others
                if ms.status != 2 {
                    all_approved = false;
                    break;
                }
                k += 1;
            };

            if all_approved {
                let completed_escrow = EscrowContract {
                    client: escrow.client,
                    freelancer: escrow.freelancer,
                    token: escrow.token,
                    total_amount: escrow.total_amount,
                    deposited: escrow.deposited,
                    status: 1,  // Completed
                    milestone_count: escrow.milestone_count,
                    created_at: escrow.created_at,
                };
                self.contracts.entry(contract_id).write(completed_escrow);
            }

            // --- Emit event ---
            self.emit(Event::MilestoneApproved(MilestoneApproved {
                contract_id,
                milestone_index,
                client: caller,
                amount: milestone.amount,
            }));
        }

        // --------------------------------------------------------------------
        // raise_dispute
        // Either client or freelancer can raise a dispute on a milestone.
        // Marks the milestone as Disputed and the contract as Disputed.
        // --------------------------------------------------------------------
        fn raise_dispute(ref self: ContractState, contract_id: u256, milestone_index: u32) {
            let caller = get_caller_address();
            let escrow = self.contracts.entry(contract_id).read();

            // --- Validations ---
            assert!(
                caller == escrow.client || caller == escrow.freelancer,
                "Only client or freelancer can raise a dispute"
            );
            assert!(escrow.deposited, "Funds not yet deposited");
            assert!(escrow.status == 0, "Contract is not active");
            assert!(milestone_index < escrow.milestone_count, "Invalid milestone index");

            let milestone = self.milestones.entry(contract_id).entry(milestone_index).read();
            assert!(
                milestone.status == 0 || milestone.status == 1,
                "Milestone cannot be disputed in its current status"
            );

            // --- Update milestone status to Disputed ---
            let updated_milestone = Milestone {
                description: milestone.description,
                amount: milestone.amount,
                status: 3,  // Disputed
                proof_hash: milestone.proof_hash,
            };
            self.milestones.entry(contract_id).entry(milestone_index).write(updated_milestone);

            // --- Update contract status to Disputed ---
            let disputed_escrow = EscrowContract {
                client: escrow.client,
                freelancer: escrow.freelancer,
                token: escrow.token,
                total_amount: escrow.total_amount,
                deposited: escrow.deposited,
                status: 2,  // Disputed
                milestone_count: escrow.milestone_count,
                created_at: escrow.created_at,
            };
            self.contracts.entry(contract_id).write(disputed_escrow);

            // --- Emit event ---
            self.emit(Event::DisputeRaised(DisputeRaised {
                contract_id,
                milestone_index,
                raised_by: caller,
            }));
        }

        // --------------------------------------------------------------------
        // Read Functions
        // --------------------------------------------------------------------

        fn get_contract(self: @ContractState, contract_id: u256) -> EscrowContract {
            self.contracts.entry(contract_id).read()
        }

        fn get_milestone(self: @ContractState, contract_id: u256, milestone_index: u32) -> Milestone {
            self.milestones.entry(contract_id).entry(milestone_index).read()
        }

        fn get_contract_count(self: @ContractState) -> u256 {
            self.contract_count.read()
        }
    }
}
