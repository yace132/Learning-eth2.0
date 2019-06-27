#### proposerSlashings.ts
> slash proposer who propose different headers of the same block
> 
    export default function processProposerSlashings(state: BeaconState, block: BeaconBlock): void {}

>
    for (const proposerSlashing of block.body.proposerSlashings)

>> record misbehave proposers to block.body as proposerSlashings       

     assert(slotToEpoch(proposerSlashing.header1.slot) === slotToEpoch(proposerSlashing.header2.slot));
      assert(!serialize(proposerSlashing.header1, BeaconBlockHeader).equals(
        serialize(proposerSlashing.header2, BeaconBlockHeader)));
      assert(isSlashableValidator(proposer, getCurrentEpoch(state)));
>> misbehave proposer give the same epoch with different headers
>> can we punish wrong header or who propose too early?
>> 
    const proposalData1Verified = blsVerify();
    assert(proposalData1Verified);
    const proposalData2Verified = blsVerify();
    assert(proposalData2Verified);
    
>> check the misbehave proposer sign 2 different headers

    slashValidator(state, proposerSlashing.proposerIndex);