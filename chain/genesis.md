#### genesis.ts
> Generate genesis block by deposits on eth1.0
> 
	export function getGenesisBeaconState(
	  genesisValidatorDeposits: Deposit[],
	  genesisTime: number64,
	  genesisEth1Data: Eth1Data): BeaconState
>>Relay genesis deposits to eth2.0
>>1. relay deposit root: recorded in `genesisEth1Data`
>>2. relay deposits: `genesisValidatorDeposits`
>>
	const state: BeaconState = {//..}
>> Set all data strucuture to zero exclude `latestEth1Data`
>> `latestEth1Data` = `genesisEth1Data`

	genesisValidatorDeposits.forEach((deposit) =>
    processDeposit(state, deposit));
>> People who has deposited become validators
>> Initialize all validators' status epochs as Infinity

>>
	state.validatorRegistry.forEach((validator) => {
		if (validator.effectiveBalance.gte(MAX_EFFECTIVE_BALANCE)) {
		  validator.activationEligibilityEpoch = GENESIS_EPOCH;
		  validator.activationEpoch = GENESIS_EPOCH;
		}
	  });
>> Activate validators who owns > 32 eth
>> They want to be activated at `GENESIS_EPOCH`
>> And they are activated at `GENESIS_EPOCH`
>> 

>>
	const genesisActiveIndexRoot =
		hashTreeRoot(getActiveValidatorIndices(state, GENESIS_EPOCH), [ValidatorIndex]);
	  for (let i = 0; i < LATEST_ACTIVE_INDEX_ROOTS_LENGTH; i++) {
		state.latestActiveIndexRoots[i] = genesisActiveIndexRoot;
	  }
	return state;
>>Record active validator indices ( root )
>>Notice that, now all `latestActiveIndexRoots` are `genesisActiveIndexRoot` ( not zero )


	