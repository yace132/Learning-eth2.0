#### proposerSlashings.ts
> Slash proposer who propose different headers of the same block
> 
    export default function processProposerSlashings(state: BeaconState, block: BeaconBlock): void {}

>
    for (const proposerSlashing of block.body.proposerSlashings)

>> Record misbehave proposers to block.body as proposerSlashings       

     assert(slotToEpoch(proposerSlashing.header1.slot) === slotToEpoch(proposerSlashing.header2.slot));
      assert(!serialize(proposerSlashing.header1, BeaconBlockHeader).equals(
        serialize(proposerSlashing.header2, BeaconBlockHeader)));
      assert(isSlashableValidator(proposer, getCurrentEpoch(state)));
>> Misbehave proposer give the same epoch with different headers
>> Can we punish wrong header or who propose too early?
>> 
    const proposalData1Verified = blsVerify(/*...*/);
    assert(proposalData1Verified);
    const proposalData2Verified = blsVerify(/*...*/);
    assert(proposalData2Verified);
    
>> check the misbehave proposer sign 2 different headers

    slashValidator(state, proposerSlashing.proposerIndex);
>> Slash misbehave propser
>> Give his money ( 1/512 ) to proposer
>> Misbehave proposer enters exit queue	

>
	export default function processProposerSlashings(state: BeaconState, block: BeaconBlock): void {
	  assert(block.body.proposerSlashings.length <= MAX_PROPOSER_SLASHINGS);
	  for (const proposerSlashing of block.body.proposerSlashings) {
		processProposerSlashing(state, proposerSlashing);
	  }
>>`MAX_PROPOSER_SLASHINGS` = 16
>>Slash at most 16 proposers each slot
