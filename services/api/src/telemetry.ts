import { mkdir, appendFile } from "node:fs/promises";
import {
  context,
  trace,
  propagation,
  SpanStatusCode,
} from "@opentelemetry/api";
import { AsyncLocalStorageContextManager } from "@opentelemetry/context-async-hooks";
import { W3CTraceContextPropagator } from "@opentelemetry/core";
import {
  TracerProvider,
  SimpleSpanProcessor,
  TraceIdRatioBasedSampler,
  type SpanExporter,
} from "@opentelemetry/sdk-trace";
const file = process.env.TRACE_FILE || ".runtime/traces.jsonl";
let writes = Promise.resolve();
const exporter: SpanExporter = {
  export(spans, callback) {
    writes = writes.then(async () => {
      await mkdir(".runtime", { recursive: true });
      await appendFile(
        file,
        spans
          .map((s) =>
            JSON.stringify({
              name: s.name,
              traceId: s.spanContext().traceId,
              spanId: s.spanContext().spanId,
              parentSpanId: s.parentSpanContext?.spanId,
              attributes: s.attributes,
              status: s.status,
              durationMs: s.duration[0] * 1000 + s.duration[1] / 1e6,
            }),
          )
          .join("\n") + "\n",
      );
    });
    writes.then(
      () => callback({ code: 0 }),
      () => callback({ code: 1 }),
    );
  },
  async shutdown() {
    await writes;
  },
};
context.setGlobalContextManager(new AsyncLocalStorageContextManager().enable());
propagation.setGlobalPropagator(new W3CTraceContextPropagator());
const provider = new TracerProvider({
  sampler: new TraceIdRatioBasedSampler(
    Number(process.env.TRACE_SAMPLE_RATE || 0.1),
  ),
  spanProcessors: [new SimpleSpanProcessor({ exporter })],
});
trace.setGlobalTracerProvider(provider);
export const tracer = trace.getTracer("synthetic-hospital-ur");
export { context, trace, propagation, SpanStatusCode };
export async function dependencySpan<T>(
  name: string,
  fn: () => Promise<T>,
): Promise<T> {
  return tracer.startActiveSpan(name, async (span) => {
    try {
      return await fn();
    } catch (e) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: "dependency_failed",
      });
      throw e;
    } finally {
      span.end();
    }
  });
}
export const closeTelemetry = () => provider.shutdown();
