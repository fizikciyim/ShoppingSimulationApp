import { advanceOrderOneStep } from "../utils/orderSimulation.js";
import { scheduleNextStep } from "../utils/scheduler.js";

export const handler = async (event) => {
  const { orderId, stepIndex } = event;

  console.log("orderProgress tetiklendi:", event);

  const result = await advanceOrderOneStep(orderId, stepIndex);

  if (result.finished || result.cancelled) {
    return { done: true };
  }

  // Bir sonraki adımı planla
  await scheduleNextStep(orderId, result.nextStepIndex);

  return { ok: true };
};
