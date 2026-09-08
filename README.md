
# CI/CD Demo: Jenkins → Docker → Kubernetes

A minimal but complete end-to-end pipeline: a Node.js app is checked out, tested,
containerized, pushed to a registry, and deployed to Kubernetes — all automated
through a single `Jenkinsfile`.

## Architecture

```
Git push
   │
   ▼
Jenkins (webhook trigger)
   │
   ├─ Checkout source
   ├─ npm install
   ├─ npm test (unit tests, JUnit report)
   ├─ docker build → tag with build number + git SHA
   ├─ docker push → container registry (Docker Hub / ECR / GCR)
   └─ kubectl set image → rolling update on the K8s Deployment
                              │
                              ▼
                     Kubernetes cluster
                     ┌─────────────────────┐
                     │ Deployment (3 pods) │
                     │  readiness/liveness │
                     │  probes on /health  │
                     └─────────┬───────────┘
                               │
                        Service (ClusterIP)
```

## Project layout

```
jenkins-cicd-project/
├── app/
│   ├── index.js          # Express app with / and /health endpoints
│   ├── index.test.js      # Jest tests
│   └── package.json
├── Dockerfile              # Multi-stage build, runs as non-root
├── Jenkinsfile              # Full pipeline: build → test → dockerize → push → deploy
└── k8s/
    ├── namespace.yaml
    ├── deployment.yaml     # 3 replicas, rolling update, resource limits, probes
    └── service.yaml
```

## How to actually run this (to build real hands-on experience)

### 1. Run the app locally
```bash
cd app
npm install
npm test
npm start   # visit http://localhost:3000 and http://localhost:3000/health
```

### 2. Build and run the container
```bash
docker build -t cicd-demo-app:local .
docker run -p 3000:3000 cicd-demo-app:local
```

### 3. Set up Jenkins (free options for practice)
- Run Jenkins locally in Docker: `docker run -p 8080:8080 jenkins/jenkins:lts`
- Install plugins: Docker Pipeline, Kubernetes CLI, Git
- Create Jenkins credentials:
  - `dockerhub-credentials` — username/password for Docker Hub (or ECR/GCR auth)
  - `kubeconfig-credentials` — a Secret file credential containing your kubeconfig
- Point a Multibranch Pipeline or Pipeline job at this repo; Jenkins will pick up
  the `Jenkinsfile` automatically.

### 4. Set up a Kubernetes cluster to deploy into
- Free local options: **minikube**, **kind**, or **k3d**
- Apply the base manifests once manually, then let Jenkins handle image updates:
  ```bash
  kubectl apply -f k8s/namespace.yaml
  kubectl apply -f k8s/deployment.yaml
  kubectl apply -f k8s/service.yaml
  ```

### 5. Trigger the pipeline
Push a commit — Jenkins builds, tests, pushes the image, and runs
`kubectl set image` to trigger a rolling update, which you can watch with:
```bash
kubectl rollout status deployment/cicd-demo-app -n demo
kubectl get pods -n demo -w
```

## Why these design choices (good talking points for interviews)

- **Multi-stage Dockerfile** — smaller final image, no build tools in the runtime image.
- **Non-root container user** — basic security hardening.
- **Image tagged with build number + git SHA**, not `latest` — every deploy is traceable
  and trivially rollback-able (`kubectl rollout undo`).
- **Readiness vs liveness probes** — readiness controls traffic routing during startup;
  liveness restarts a pod that's hung, and they're deliberately separate.
- **RollingUpdate with `maxUnavailable: 0`** — zero-downtime deploys.
- **Jenkins credentials store** — no secrets hardcoded in the Jenkinsfile.

## Extending this further
- Add a `values.yaml` and convert `k8s/` into a Helm chart.
- Add a staging namespace + manual approval gate before prod deploy.
- Add SonarQube or a linting stage before the Docker build.
- Swap `kubectl set image` for a GitOps flow (Argo CD) triggered by updating a
  manifests repo instead of applying directly from Jenkins.
