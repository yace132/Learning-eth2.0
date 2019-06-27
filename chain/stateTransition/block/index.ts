#### index.ts
>
    export default function processBlock(state: BeaconState, block: BeaconBlock): void {
    // Slot
    assert(block.slot === state.slot, "block root must equal state root");
    
    // Proposer signature
    processProposerSignature(state, block);
    
    // RANDAO
    processRandao(state, block);

    // Eth1 Data
    processEth1Data(state, block);

    // Transactions

    // Proposer slashings
    processProposerSlashings(state, block);

    // Attester slashings
    processAttesterSlashings(state, block);

    // Attestations
    processAttestations(state, block);

    // Deposits
    processDeposits(state, block);

    // Voluntary Exits
    processVoluntaryExits(state, block);

    // Transfers
    processTransfers(state, block);
    }
> in processBlock()
> 
    // Slot
    assert(block.slot === state.slot, "block root must equal state root");
>> The state has changed b/c processSlot()
>> So new slot of new block is same to slot of state
