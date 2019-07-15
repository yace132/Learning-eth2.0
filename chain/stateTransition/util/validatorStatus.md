#### validatorStatus.ts
> Queue for exit 
> 
	export function initiateValidatorExit(state: BeaconState, index: ValidatorIndex): void
>> Notice that validator queue in this slot
>> But validator exits at future epoch


	const validator = state.validatorRegistry[index];

	  if (validator.exitEpoch !== FAR_FUTURE_EPOCH) {
		return;
	  }
>>Check validator has not exited
>>
	let exitQueueEpoch = state.validatorRegistry.reduce((epoch: Epoch, v: Validator) => {
		if (v.exitEpoch !== FAR_FUTURE_EPOCH) {
		  return Math.max(v.exitEpoch, epoch);
		}
		return epoch;
	  }, getDelayedActivationExitEpoch(getCurrentEpoch(state)));
>>`if (v.exitEpoch !== FAR_FUTURE_EPOCH)`
>>`v` exits in some epoch

>>`return Math.max(v.exitEpoch, epoch)` in `validatorRegistry.reduce()`
>>Compute the latest epoch of validators who exits

>>`getDelayedActivationExitEpoch(getCurrentEpoch(state))`
>>The earliest epoch `validator` can exit
>>Also compare this epoch to other epochs
>>( Maybe some validator exit in very late epoch )

>> Validators who exits need to line up
>>`validator` queue at `exitQueueEpoch`
>>`validator` is behind all other validator
>>
	const exitQueueChurn = state.validatorRegistry
		.filter((v: Validator) => v.exitEpoch === exitQueueEpoch).length;
	  if (exitQueueChurn >= getChurnLimit(state)) {
		exitQueueEpoch += 1;
	  }
>>We hope overhead of exits in `exitQueueEpoch` is low
>>So we limit `exitQueueEpoch` exit at most `getChurnLimit(state)` validators
>>Access active validators from `state`
>>Queue to next epoch if churn too large

	validator.exitEpoch = exitQueueEpoch;
>> Queue at this epoch
>> 
  	validator.withdrawableEpoch = validator.exitEpoch + MIN_VALIDATOR_WITHDRAWAL_DELAY;
>>`MIN_VALIDATOR_WITHDRAWAL_DELAY`=256 epochs ~ 1 day
>>
>Slash validator ( may b/c whistleblow )
>
	export function slashValidator(
	  state: BeaconState,
	  slashedIndex: ValidatorIndex,
	  whistleblowerIndex: ValidatorIndex | null = null
	): void
>>	
	const currentEpoch = getCurrentEpoch(state);

	  initiateValidatorExit(state, slashedIndex);
	  state.validatorRegistry[slashedIndex].slashed = true;
	  state.validatorRegistry[slashedIndex].withdrawableEpoch =
		currentEpoch + LATEST_SLASHED_EXIT_LENGTH;
>>validator queue for exit, but slash her first
>>After `LATEST_SLASHED_EXIT_LENGTH`= 2^13 ~ 1 month, validator can withdraw
>>
>>
	const slashedBalance = state.validatorRegistry[slashedIndex].effectiveBalance;
	  state.latestSlashedBalances[currentEpoch % LATEST_SLASHED_EXIT_LENGTH] =
		state.latestSlashedBalances[currentEpoch % LATEST_SLASHED_EXIT_LENGTH].add(slashedBalance);
>>We add every slash balance of 1 epoch
>>We record latest 2^13 epochs' slashedbalances
>>( After 2^13 epoch, we don't record. Also, validator can withdraw )

	const proposerIndex = getBeaconProposerIndex(state);
	  if (whistleblowerIndex === undefined || whistleblowerIndex === null) {
		whistleblowerIndex = proposerIndex;
	  }
	  const whistleblowingReward = slashedBalance.divn(WHISTLEBLOWING_REWARD_QUOTIENT);
	  const proposerReward = whistleblowingReward.divn(PROPOSER_REWARD_QUOTIENT);
	  increaseBalance(state, proposerIndex, proposerReward);
	  increaseBalance(state, whistleblowerIndex, whistleblowingReward.sub(proposerReward));
	  decreaseBalance(state, slashedIndex, whistleblowingReward);
>>Process penalty, proposer and whistleblower can take the money
>>`WHISTLEBLOWING_REWARD_QUOTIENT`=512
>>`PROPOSER_REWARD_QUOTIENT` = 8
>>
	                          /-- 1/8 --> proposer
	slashedBalance -- 1/512 -- 
	                          \-- 7/8 --> whistleblower
>>Misbehave proposer decrease 1/512 deposit
