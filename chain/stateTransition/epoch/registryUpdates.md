#### registryUpdates.ts
>
	export function processRegistryUpdates(state: BeaconState): BeaconState
>>
	state.validatorRegistry.forEach((validator, index) => {
		if (validator.activationEligibilityEpoch ===
		  FAR_FUTURE_EPOCH && validator.effectiveBalance.gte(maxBalance)) {
		  validator.activationEligibilityEpoch = currentEpoch;
		}
		if (isActiveValidator(validator, currentEpoch) &&
		  validator.effectiveBalance.lte(ejectionBalance)) {
		  initiateValidatorExit(state, index);
		}
	  });
>>`maxBalance`
>>`MAX_EFFECTIVE_BALANCE`, 32 eth
>>`ejectionBalance`
>>`EJECTION_BALANCE`, 16 eth

>> deposit > 32 eth --> activate
>> deposit < 16 eth after activate --> exit
>>>( misbehavior penalty.  other reasons possible? )

>>activationEligibility means deposit is enough

>>
	const activationQueue = state.validatorRegistry.filter((validator) =>
		validator.activationEligibilityEpoch !== FAR_FUTURE_EPOCH &&
		validator.activationEpoch >= getDelayedActivationExitEpoch(state.finalizedEpoch)
	  ).sort((a, b) => a.activationEligibilityEpoch - b.activationEligibilityEpoch);
>> Sort who has enough deposit ( has not activated before )
>> 
	activationQueue.slice(0, getChurnLimit(state)).forEach((validator) => {
		if (validator.activationEpoch === FAR_FUTURE_EPOCH) {
		  validator.activationEpoch = getDelayedActivationExitEpoch(currentEpoch);
		}
>> Activate who hasn't activated at `getDelayedActivationExitEpoch(currentEpoch)`
>> Limit the amounts
>> Who has enough deposits earlier has the chance
