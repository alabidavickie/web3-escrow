#[starknet::interface]
pub trait ICounter<TContractState> {
    fn get_count(self: @TContractState) -> u32;
    fn increment(ref self: TContractState);
}

#[starknet::contract]
mod Counter {
    #[storage]
    struct Storage {
        count: u32,
    }

    #[constructor]
    fn constructor(ref self: ContractState, initial_count: u32) {
        self.count.write(initial_count);
    }

    #[abi(embed_v0)]
    impl CounterImpl of super::ICounter<ContractState> {
        fn get_count(self: @ContractState) -> u32 {
            self.count.read()
        }

        fn increment(ref self: ContractState) {
            let current_count = self.count.read();
            self.count.write(current_count + 1);
        }
    }
}
