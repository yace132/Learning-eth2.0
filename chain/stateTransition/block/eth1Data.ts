#### eth1Data.ts
    
    
    export default function processEth1Data(state: BeaconState, block: BeaconBlock): void {}

>>
	const blockEth1Data = block.body.eth1Data;
	  state.eth1DataVotes.push(blockEth1Data);
	  const serializedBlockEth1Data = serialize(blockEth1Data, Eth1Data);
	  let occurances = 0;
	  state.eth1DataVotes.forEach((eth1Data) => {
		if (serialize(eth1Data, Eth1Data).equals(serializedBlockEth1Data)) {
		  occurances++;
		}
	  });
>> Counting votes
>>> Each block, we add 1 ( proposer's ) vote
>> We vote for some eth1 block, deposit root ( of this block ) and deposit count
>> That is, we vote some state of deposits in eth1 block

>> 

	if (occurances * 2 > SLOTS_PER_ETH1_VOTING_PERIOD) {
		state.latestEth1Data = block.body.eth1Data;
	  }
	  
>> Open votes
>>> And for each slot, we calculate votes, if votes> 1/2 `SLOTS_PER_ETH1_VOTING_PERIOD`, we can update `state.latestEth1Data`
>>`SLOTS_PER_ETH1_VOTING_PERIOD` = 1024

>>Note that, before spec v0.6 ( exclude v0.6 )
>>>We can open votes only at epoch boundary slot