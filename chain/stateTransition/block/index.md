#### index.ts
>
	export function processBlock(state: BeaconState, block: BeaconBlock, verify: boolean = true): void {
	  // block header
	  processBlockHeader(state, block, verify);

	  // RANDAO
	  processRandao(state, block);

	  // Eth1 Data
	  processEth1Data(state, block);

	  // Operations

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

	  if(verify) {
		// Verify block stateRoot
		verifyBlockStateRoot(state, block);
	  }
	}
>>
	processBlockHeader(state, block, verify);
>> Verify proposer's signature

	processRandao(state, block);
>> Generate new random number of epoch
>> 
	processEth1Data(state, block);
>> Relay eth1.0 block header and deposit root
>> 
	processProposerSlashings(state, block);
	processAttesterSlashings(state, block);
>> Slash misbehave validators
>> 
	processAttestations(state, block);
>> Announce results of attestation election ( election recount? )
>> Check attestations format
>> 
	processDeposits(state, block);
>> Relay deposits and create validatos
>> 
	processVoluntaryExits(state, block);
>>Validators who wants to exit queue to exit
>>
	processTransfers(state, block);
>> Special tx
>> Validators make transactions with each other
