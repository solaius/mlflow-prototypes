"""
Seed the dev server with sample experiments, traces, and eval runs for the
Agent Registry prototype.

Usage:
    MLFLOW_TRACKING_URI=http://localhost:5000 uv run python dev/seed_agent_traces.py

Idempotently creates one experiment per agent (get-or-create by name), then
populates each with traces and evaluation runs that mirror the mock data in
agent-registry/mocks/experimentTrackingStore.ts.

The Agent Registry frontend hardcodes experiment_id "1" / "2" / "3" in
experimentTrackingStore.ts, so the "Traces" / "Evals" link-outs only resolve
when these experiments get exactly those IDs. On a fresh dev-server store (which
holds only the Default experiment, id 0) creating them in order yields 1/2/3.
The script prints the assigned IDs at the end and warns if they don't line up,
in which case restart the dev server (its store is ephemeral) and re-run this.
"""

import mlflow

# Experiment names match the `experiment_name` fields in the frontend mock. Order matters:
# on a fresh store these are created as ids 1, 2, 3, which the frontend hardcodes.
EXPERIMENTS = [
    {
        "name": "/agents/sre/incident-commander",
        "expected_id": "1",
        "traces": [
            {
                "name": "incident-commander",
                "input": "Investigate alert: pod crash loop in namespace prod-billing",
                "output": "Root cause: OOM kill on billing-api pod. Scaled memory limit from 512Mi to 1Gi, restart confirmed stable.",
                "spans": [
                    ("analyze_alert", "LLM", "Classify alert severity and identify affected service", "Severity: P2, Service: billing-api, Symptom: CrashLoopBackOff"),
                    ("search_incidents", "TOOL", "query: billing-api crash loop", "2 prior incidents found (INC-4102, INC-3987)"),
                    ("fetch_runbook", "RETRIEVAL", "runbook: pod-crashloop-remediation", "Retrieved: 3 remediation steps"),
                    ("correlate_events", "LLM", "Correlate pod events, resource metrics, and recent deploys", "Memory usage spike after deploy d-8821, OOM threshold hit"),
                    ("apply_remediation", "TOOL", "patch deployment billing-api: memory 512Mi->1Gi", "Deployment patched, rollout status: 3/3 ready"),
                    ("summarize", "LLM", "Generate incident summary", "Root cause: OOM kill. Fix: memory limit increase. Status: resolved."),
                ],
            },
            {
                "name": "incident-commander",
                "input": "Check cluster health after rolling upgrade",
                "output": "All 12 nodes healthy. No degraded pods. Upgrade to k8s 1.30 completed successfully.",
                "spans": [
                    ("check_nodes", "TOOL", "kubectl get nodes", "12/12 Ready"),
                    ("check_pods", "TOOL", "kubectl get pods --all-namespaces | grep -v Running", "0 non-running pods"),
                    ("summarize", "LLM", "Summarize cluster health", "All 12 nodes healthy. Upgrade complete."),
                ],
            },
            {
                "name": "incident-commander",
                "input": "Triage high-latency alert on inference-gateway",
                "output": "Error: timed out waiting for metrics endpoint. Partial analysis: gateway p99 latency at 4.2s (threshold: 2s).",
                "error": True,
                "spans": [
                    ("analyze_alert", "LLM", "Classify alert and identify service", "Service: inference-gateway, p99 latency exceeded"),
                    ("fetch_metrics", "TOOL", "query prometheus: inference_gateway_latency_p99", None),
                ],
            },
            {
                "name": "incident-commander",
                "input": "Build incident timeline for outage #4281",
                "output": "Timeline: 14:02 deploy started -> 14:08 first alerts -> 14:12 rollback initiated -> 14:15 service restored.",
                "spans": [
                    ("fetch_deploy_log", "TOOL", "get deploy d-4281 timeline", "Deploy started 14:02, completed 14:06"),
                    ("fetch_alerts", "RETRIEVAL", "alerts for outage #4281", "3 alerts: 14:08, 14:09, 14:10"),
                    ("correlate", "LLM", "Build timeline from deploy + alerts", "Deploy -> alerts -> rollback -> restore"),
                    ("summarize", "LLM", "Format incident timeline", "14:02 deploy -> 14:08 alerts -> 14:12 rollback -> 14:15 restored"),
                ],
            },
            {
                "name": "incident-commander",
                "input": "Correlate OOM events with recent deploys",
                "output": "Found 3 OOM events in last 24h, all on billing-api pods. Correlated with deploy d-8821 (memory regression).",
                "spans": [
                    ("fetch_oom_events", "TOOL", "kubectl get events --field-selector reason=OOMKilled", "3 OOM events on billing-api"),
                    ("fetch_deploys", "TOOL", "list recent deploys for billing-api", "deploy d-8821 at 2h ago"),
                    ("correlate", "LLM", "Correlate OOM events with deploy timeline", "All 3 OOMs after d-8821, memory regression confirmed"),
                ],
            },
        ],
        "evals": [
            {
                "run_name": "run-ic-v200-eval-3",
                "agent_version": "2.0.0",
                "dataset": "incident-response-golden-set",
                "case_count": 150,
                "scorers": ["Correctness", "Safety", "Hallucination", "Completeness", "ToolCallCorrectness"],
                "scores": {"correctness": 0.96, "safety": 0.99, "hallucination": 0.03, "completeness": 0.91, "tool_call_correctness": 0.94},
            },
            {
                "run_name": "run-ic-v200-eval-2",
                "agent_version": "2.0.0",
                "dataset": "incident-response-golden-set",
                "case_count": 150,
                "scorers": ["Correctness", "Safety", "Hallucination"],
                "scores": {"correctness": 0.93, "safety": 0.98, "hallucination": 0.05},
            },
            {
                "run_name": "run-ic-v200-eval-1",
                "agent_version": "2.0.0",
                "dataset": "incident-edge-cases",
                "case_count": 50,
                "scorers": ["Correctness", "ToolCallCorrectness"],
                "scores": {"correctness": 0.88, "tool_call_correctness": 0.90},
            },
            {
                "run_name": "run-ic-v120-eval",
                "agent_version": "1.2.0",
                "dataset": "incident-response-golden-set",
                "case_count": 150,
                "scorers": ["Correctness", "Safety", "Hallucination"],
                "scores": {"correctness": 0.71, "safety": 0.93, "hallucination": 0.18},
            },
            {
                "run_name": "run-ic-v100-eval",
                "agent_version": "1.0.0",
                "dataset": "incident-response-golden-set",
                "case_count": 150,
                "scorers": ["Correctness", "Safety", "Hallucination"],
                "scores": {"correctness": 0.82, "safety": 0.95, "hallucination": 0.12},
            },
        ],
    },
    {
        "name": "/agents/sre/cve-remediation",
        "expected_id": "2",
        "traces": [
            {
                "name": "cve-remediation",
                "input": "Scan CVE-2026-31337 against dependency manifests",
                "output": "CVE-2026-31337 affects openssl 3.1.x. Found in 4 services. Remediation: upgrade to openssl 3.2.1.",
                "spans": [
                    ("fetch_cve", "RETRIEVAL", "CVE-2026-31337 details from NVD", "openssl 3.1.x buffer overflow, CVSS 8.1"),
                    ("scan_manifests", "TOOL", "grep openssl across all go.sum/requirements.txt", "4 services affected"),
                    ("assess_impact", "LLM", "Assess impact and generate remediation plan", "Critical: 4 services, upgrade to 3.2.1"),
                    ("generate_pr", "TOOL", "create PR bumping openssl in affected services", "PR #892 created"),
                ],
            },
            {
                "name": "cve-remediation",
                "input": "Assess RHSA-2026:4512 impact on cluster fleet",
                "output": "RHSA-2026:4512 (kernel): 8/12 nodes running affected kernel. Remediation: rolling reboot with patched kernel.",
                "spans": [
                    ("fetch_advisory", "RETRIEVAL", "RHSA-2026:4512 details", "kernel vulnerability, affects RHEL 9.x"),
                    ("scan_fleet", "TOOL", "check kernel versions across fleet", "8/12 nodes on affected kernel"),
                    ("plan_remediation", "LLM", "Plan rolling kernel update", "Rolling reboot, 2 nodes at a time, drain first"),
                ],
            },
            {
                "name": "cve-remediation",
                "input": "Open remediation PR for log4j vulnerability",
                "output": "PR #903 opened: upgrades log4j from 2.14.1 to 2.21.0 across 2 Java services.",
                "spans": [
                    ("scan_deps", "TOOL", "find log4j in pom.xml/build.gradle", "2 services: auth-service, audit-logger"),
                    ("check_compat", "LLM", "Check compatibility of log4j 2.21.0", "Compatible, no breaking API changes"),
                    ("create_pr", "TOOL", "create PR with version bump", "PR #903 created"),
                    ("add_tests", "TOOL", "run existing test suites against bump", "All tests pass"),
                ],
            },
        ],
        "evals": [
            {
                "run_name": "run-cve-v100-eval-2",
                "agent_version": "1.0.0",
                "dataset": "cve-triage-cases",
                "case_count": 80,
                "scorers": ["Correctness", "Safety", "Hallucination", "ToolCallCorrectness"],
                "scores": {"correctness": 0.93, "safety": 0.98, "hallucination": 0.05, "tool_call_correctness": 0.91},
            },
            {
                "run_name": "run-cve-v100-eval-1",
                "agent_version": "1.0.0",
                "dataset": "cve-triage-cases",
                "case_count": 80,
                "scorers": ["Correctness", "Safety"],
                "scores": {"correctness": 0.89, "safety": 0.97},
            },
            {
                "run_name": "run-cve-v090-eval",
                "agent_version": "0.9.0",
                "dataset": "cve-triage-cases",
                "case_count": 80,
                "scorers": ["Correctness", "Safety", "Hallucination"],
                "scores": {"correctness": 0.88, "safety": 0.97, "hallucination": 0.09},
            },
        ],
    },
    {
        "name": "/agents/ai-platform/model-deployer",
        "expected_id": "3",
        "traces": [
            {
                "name": "model-deployer",
                "input": "Deploy granite-3.3-8b to staging InferenceService",
                "output": "granite-3.3-8b deployed to staging. InferenceService ready, health check passed.",
                "spans": [
                    ("validate_model", "LLM", "Validate model artifact and serving config", "Model valid, vLLM runtime compatible"),
                    ("check_gpu", "TOOL", "check GPU availability in staging", "2x A100 available"),
                    ("create_isvc", "TOOL", "kubectl apply InferenceService manifest", "InferenceService created"),
                    ("wait_ready", "TOOL", "poll InferenceService status", "Ready after 45s"),
                    ("health_check", "TOOL", "POST /v1/completions with test prompt", "200 OK, latency 1.2s"),
                    ("summarize", "LLM", "Generate deployment report", "Deployed successfully to staging"),
                ],
            },
            {
                "name": "model-deployer",
                "input": "Validate GPU capacity for llama-3.3-70b rollout",
                "output": "Insufficient GPU: need 4x A100-80GB, only 2 available. Recommendation: request quota increase or use quantized model.",
                "spans": [
                    ("estimate_resources", "LLM", "Estimate GPU requirements for llama-3.3-70b", "4x A100-80GB for FP16 serving"),
                    ("check_capacity", "TOOL", "query GPU allocator for A100 availability", "2x A100-80GB free, 2 in use"),
                    ("recommend", "LLM", "Generate capacity recommendation", "Request quota increase or use AWQ quantized variant (2x A100)"),
                ],
            },
            {
                "name": "model-deployer",
                "input": "Deploy fine-tuned model to production - insufficient GPU quota",
                "output": "Error: deployment failed. GPU quota exceeded in production namespace.",
                "error": True,
                "spans": [
                    ("validate_model", "LLM", "Validate fine-tuned model artifact", "Model valid, 7B params"),
                    ("check_quota", "TOOL", "check production GPU quota", "Quota: 4 GPUs, Used: 4, Available: 0"),
                    ("fail", "TOOL", "abort deployment", None),
                ],
            },
        ],
        "evals": [
            {
                "run_name": "run-md-v200-eval",
                "agent_version": "2.0.0",
                "dataset": "deploy-scenario-suite",
                "case_count": 60,
                "scorers": ["Correctness", "Safety", "ToolCallCorrectness", "ToolCallEfficiency"],
                "scores": {"correctness": 0.94, "safety": 0.99, "tool_call_correctness": 0.95, "tool_call_efficiency": 0.88},
            },
            {
                "run_name": "run-md-v110-eval",
                "agent_version": "1.1.0",
                "dataset": "deploy-scenario-suite",
                "case_count": 60,
                "scorers": ["Correctness", "Safety", "ToolCallCorrectness"],
                "scores": {"correctness": 0.90, "safety": 0.96, "tool_call_correctness": 0.87},
            },
            {
                "run_name": "run-md-v100-eval",
                "agent_version": "1.0.0",
                "dataset": "deploy-scenario-suite",
                "case_count": 60,
                "scorers": ["Correctness", "Safety", "ToolCallCorrectness"],
                "scores": {"correctness": 0.85, "safety": 0.92, "tool_call_correctness": 0.78},
            },
        ],
    },
]


def ensure_experiment(name):
    experiment = mlflow.get_experiment_by_name(name)
    if experiment is not None:
        return experiment.experiment_id
    return mlflow.create_experiment(name)


def create_trace(experiment_id, trace_data):
    mlflow.set_experiment(experiment_id=experiment_id)

    with mlflow.start_span(name=trace_data["name"], span_type="AGENT") as root:
        root.set_inputs({"request": trace_data["input"]})

        for span_name, span_type, inp, out in trace_data["spans"]:
            with mlflow.start_span(name=span_name, span_type=span_type) as child:
                if inp:
                    child.set_inputs({"input": inp})
                if out:
                    child.set_outputs({"output": out})
                elif trace_data.get("error") and span_name == trace_data["spans"][-1][0]:
                    child.set_status("ERROR")

        if trace_data.get("error"):
            root.set_status("ERROR")
            root.set_outputs({"error": trace_data["output"]})
        else:
            root.set_outputs({"response": trace_data["output"]})


def create_eval_run(experiment_id, eval_data):
    # A run with metrics but no logged-model outputs is classified as an evaluation run by the
    # experiment-tracking UI (see useExperimentEvaluationRunsData: no outputs.modelOutputs).
    with mlflow.start_run(experiment_id=experiment_id, run_name=eval_data["run_name"]):
        mlflow.log_params(
            {
                "dataset": eval_data["dataset"],
                "case_count": eval_data["case_count"],
                "agent_version": eval_data["agent_version"],
                "scorers": ", ".join(eval_data["scorers"]),
            }
        )
        mlflow.log_metrics(eval_data["scores"])
        mlflow.set_tags(
            {
                "eval.dataset": eval_data["dataset"],
                "agent.version": eval_data["agent_version"],
            }
        )


def main():
    print("Seeding agent experiments, traces, and eval runs into the MLflow dev server...")

    assigned = []
    for experiment in EXPERIMENTS:
        exp_id = ensure_experiment(experiment["name"])
        assigned.append((experiment["name"], exp_id, experiment["expected_id"]))

        traces = experiment["traces"]
        evals = experiment["evals"]
        print(f"\nExperiment {exp_id} ({experiment['name']}):")
        print(f"  {len(traces)} traces, {len(evals)} eval runs")

        for trace_data in traces:
            create_trace(exp_id, trace_data)
            status = "ERROR" if trace_data.get("error") else "OK"
            print(f"  [trace {status}] {trace_data['input'][:56]}...")

        for eval_data in evals:
            create_eval_run(exp_id, eval_data)
            print(f"  [eval] {eval_data['run_name']} on {eval_data['dataset']}")

    mismatched = [(name, got, want) for name, got, want in assigned if got != want]
    print("\nDone.")
    if mismatched:
        print(
            "\nWARNING: some experiments did not get the IDs the frontend hardcodes in "
            "experimentTrackingStore.ts:"
        )
        for name, got, want in mismatched:
            print(f"  {name}: got id {got}, frontend expects {want}")
        print(
            "The dev server's store is ephemeral — restart it for a clean store, then re-run "
            "this script so the agents map to experiment ids 1/2/3."
        )
    else:
        print("Experiment ids 1/2/3 line up with the frontend — Traces / Evals link-outs will resolve.")


if __name__ == "__main__":
    main()
