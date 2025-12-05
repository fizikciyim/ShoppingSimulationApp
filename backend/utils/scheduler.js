// utils/scheduler.js
import {
  SchedulerClient,
  CreateScheduleCommand,
} from "@aws-sdk/client-scheduler";

const scheduler = new SchedulerClient({
  region: process.env.AWS_REGION || "eu-west-2",
});

function randomHours(minH, maxH) {
  const h = Math.random() * (maxH - minH) + minH;
  return h;
}

export async function scheduleNextStep(orderId, stepIndex) {
  const h = randomHours(5, 24);

  const date = new Date(Date.now() + h * 60 * 60 * 1000);

  // AWS only accepts: YYYY-MM-DDTHH:mm:ss  (NO Z)
  const runAt = date.toISOString().split(".")[0]; // Z YOK

  const scheduleName = `order-${orderId}-step-${stepIndex}`;

  const cmd = new CreateScheduleCommand({
    Name: scheduleName,
    ScheduleExpression: `at(${runAt})`,
    FlexibleTimeWindow: { Mode: "OFF" },
    Target: {
      Arn: process.env.ORDER_PROGRESS_LAMBDA_ARN,
      RoleArn: process.env.EVENTBRIDGE_ROLE_ARN,
      Input: JSON.stringify({ orderId, stepIndex }),
    },
  });

  await scheduler.send(cmd);

  console.log(`⏰ Planlandı: ${runAt}`);
}
