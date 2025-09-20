# Kubernetes YAML Reference Guide

_A comprehensive reference of common Kubernetes resources with example YAMLs, field explanations, use cases, and best practices._

> **Target:** DevOps engineers, platform engineers, SREs, and developers who need ready-to-use YAML examples and explanations. Suitable for conversion to PDF.

---

## Table of Contents
1. Pod
2. Deployment
3. Service (ClusterIP, NodePort, LoadBalancer)
4. ConfigMap
5. Secret
6. Namespace
7. PersistentVolume (PV) & PersistentVolumeClaim (PVC)
8. Ingress
9. StatefulSet
10. DaemonSet

Additional sections:
- Resource limits and requests
- Probes (liveness, readiness, startup)
- Environment variables (literal, from ConfigMap, from Secret)
- Volume mounts (emptyDir, hostPath, persistentVolumeClaim)

---

# 1. Pod

**Purpose:** The smallest deployable unit in Kubernetes. A Pod encapsulates one or more containers that share storage, network, and a specification for how to run the containers.

### Key fields

| Field | Description |
|---|---|
| `apiVersion` | API group and version (e.g., `v1`) |
| `kind` | Resource kind (`Pod`) |
| `metadata` | `name`, `namespace`, `labels`, `annotations` |
| `spec.containers` | Array of container specs: `name`, `image`, `ports`, `env`, `resources`, `volumeMounts` |
| `spec.volumes` | Pod-level volumes to be mounted by containers |
| `spec.restartPolicy` | `Always`, `OnFailure`, `Never` (default `Always` when created by controllers) |

### Example YAML

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: example-pod
  namespace: default
  labels:
    app: example
spec:
  # Restart policy for containers in this Pod
  restartPolicy: Always
  containers:
    - name: nginx
      image: nginx:1.25
      # Container ports exposed (for other containers/services to reference)
      ports:
        - containerPort: 80
          name: http
      # Resource requests/limits
      resources:
        requests:
          cpu: "100m"        # request 0.1 CPU
          memory: "128Mi"    # request 128 MiB RAM
        limits:
          cpu: "500m"        # limit 0.5 CPU
          memory: "256Mi"    # limit 256 MiB RAM
      # Environment variables
      env:
        - name: GREETING
          value: "hello pod"
      # Volume mounts
      volumeMounts:
        - name: shared-data
          mountPath: /usr/share/nginx/html
  volumes:
    - name: shared-data
      emptyDir: {} # ephemeral storage shared within the Pod
```

### Common use cases
- Running a single container workload for debugging or simple tasks.
- Sidecar patterns (e.g., log forwarder + app container) inside one Pod.

### Best practices & considerations
- Prefer Deployments/StatefulSets/DaemonSets to manage Pods in production (they provide self-healing and scaling).
- Avoid running long-lived services as bare Pods unless you manage lifecycle externally.
- Keep containers within a Pod tightly coupled and co-located.

---

# 2. Deployment

**Purpose:** Declarative updates for Pods and ReplicaSets. Use Deployments for stateless apps, rolling updates, and rollbacks.

### Key fields

| Field | Description |
|---|---|
| `apiVersion` | `apps/v1` |
| `kind` | `Deployment` |
| `metadata` | `name`, `labels` |
| `spec.replicas` | Desired number of pod replicas |
| `spec.selector` | Label selector for pods managed by the Deployment |
| `spec.template` | Pod template used by the Deployment |
| `spec.strategy` | `RollingUpdate` or `Recreate` and strategy settings |

### Example YAML

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: example-deployment
  labels:
    app: example
spec:
  replicas: 3 # desired number of pods
  selector:
    matchLabels:
      app: example
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
      maxSurge: 1
  template: # pod template
    metadata:
      labels:
        app: example
    spec:
      containers:
        - name: web
          image: nginx:1.25
          ports:
            - containerPort: 80
          readinessProbe:
            httpGet:
              path: /
              port: 80
            initialDelaySeconds: 5
            periodSeconds: 10
```

### Common use cases
- Stateless web applications, APIs, worker processes.
- Continuous deployment pipelines deploy updated images via Deployment updates.

### Best practices & considerations
- Set `resources.requests` and `limits` for predictable scheduling.
- Use `readinessProbe` to avoid routing traffic to unhealthy pods during startup.
- Use labels and selectors carefully; `spec.selector` is immutable after creation.
- Prefer `apps/v1` API and specify `matchLabels` that match the template labels.

---

# 3. Service (ClusterIP, NodePort, LoadBalancer)

**Purpose:** Provide stable network endpoints to access a set of Pods. Services decouple clients from Pod IPs which are ephemeral.

### Key fields

| Field | Description |
|---|---|
| `apiVersion` | `v1` |
| `kind` | `Service` |
| `metadata` | `name`, `labels`, `annotations` |
| `spec.type` | `ClusterIP`, `NodePort`, `LoadBalancer`, `ExternalName` |
| `spec.selector` | Labels to select backend pods |
| `spec.ports` | Service port mappings: `port`, `targetPort`, `nodePort` (for NodePort) |

### ClusterIP example (default)

```yaml
apiVersion: v1
kind: Service
metadata:
  name: example-clusterip
  labels:
    app: example
spec:
  type: ClusterIP # internal cluster-only service
  selector:
    app: example
  ports:
    - port: 80         # service port
      targetPort: 80   # container port
      protocol: TCP
```

### NodePort example

```yaml
apiVersion: v1
kind: Service
metadata:
  name: example-nodeport
spec:
  type: NodePort
  selector:
    app: example
  ports:
    - port: 80
      targetPort: 80
      nodePort: 30080 # optional; if omitted, kube will assign one in range (30000-32767)
```

### LoadBalancer example (cloud providers)

```yaml
apiVersion: v1
kind: Service
metadata:
  name: example-loadbalancer
spec:
  type: LoadBalancer
  selector:
    app: example
  ports:
    - port: 80
      targetPort: 80
```

### Common use cases
- ClusterIP: internal-only services (microservice communication).
- NodePort: simple external exposure for dev or bare-metal (less recommended for production).
- LoadBalancer: expose service to external traffic using cloud provider LB.

### Best practices & considerations
- Prefer Ingress + ClusterIP services for HTTP(S) routing rather than exposing many LoadBalancers.
- Do not use NodePort for production unless behind a proper external load balancer / firewall.
- Restrict external traffic with Network Policies and firewall rules.

---

# 4. ConfigMap

**Purpose:** Store non-confidential configuration data as key-value pairs. Consumers may mount ConfigMaps as files or use values as env vars.

### Key fields

| Field | Description |
|---|---|
| `apiVersion` | `v1` |
| `kind` | `ConfigMap` |
| `metadata` | `name`, `labels` |
| `data` | key: value pairs (string values) |
| `binaryData` | binary data encoded in base64 |

### Example YAML

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: example-config
data:
  APP_ENV: "production"
  LOG_LEVEL: "info"
  config.yaml: |
    server:
      host: 0.0.0.0
      port: 8080
# You can mount this ConfigMap as files or reference values in envFrom/env
```

### Common use cases
- Application configuration (non-sensitive), feature flags, startup scripts.

### Best practices & considerations
- Avoid storing secrets in ConfigMap; use Secrets.
- Keep ConfigMaps small; there are size limits per object (practical limit ~1MB depending on cluster settings).
- Use `immutable: true` for ConfigMaps that should not change (reduces API server workload and accidental rollouts).

---

# 5. Secret

**Purpose:** Store sensitive data like passwords, tokens, keys. Secrets are encoded (base64) in YAML but not encrypted by default unless using a provider (e.g., KMS, SealedSecrets, Vault)

### Key fields

| Field | Description |
|---|---|
| `apiVersion` | `v1` |
| `kind` | `Secret` |
| `metadata` | `name`, `labels` |
| `type` | `Opaque`, `kubernetes.io/dockerconfigjson`, etc. |
| `data` | key: base64-encoded value |
| `stringData` | convenience field to provide unencoded values (server encodes them) |

### Example YAML (with base64 encoded data)

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: example-secret
type: Opaque
data:
  # base64 of 'admin' is YWRtaW4=
  username: YWRtaW4=
  # base64 of 's3cr3tP@ssw0rd' is czNjcjN0UEBzc3cwcmQ=
  password: czNjcjN0UEBzc3cwcmQ=
# Alternatively use stringData (server will encode):
# stringData:
#   password: s3cr3tP@ssw0rd
```

### Common use cases
- Database credentials, TLS private keys, API tokens.

### Best practices & considerations
- Secrets are base64-encoded, not encrypted—enable encryption at rest (Kubernetes feature) or use external secret stores (Vault, AWS Secrets Manager, SealedSecrets).
- Limit RBAC access to Secrets.
- Use `imagePullSecrets` for private registries.

---

# 6. Namespace

**Purpose:** Virtual cluster backed by the same physical cluster. Namespaces provide scoping for names, resource quotas, and multi-tenancy.

### Key fields

| Field | Description |
|---|---|
| `apiVersion` | `v1` |
| `kind` | `Namespace` |
| `metadata` | `name`, `labels`, `annotations` |

### Example YAML

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: dev-environment
  labels:
    env: dev
```

### Common use cases
- Environment separation (dev/staging/prod), team isolation, resource scoping.

### Best practices & considerations
- Combine Namespaces with ResourceQuotas and LimitRanges to protect cluster resources.
- Use NetworkPolicies and RBAC scoped to namespaces for security boundaries.

---

# 7. PersistentVolume (PV) and PersistentVolumeClaim (PVC)

**Purpose:** PV: cluster-level storage resource. PVC: a request for storage by a user. PVCs bind to PVs or trigger dynamic provisioning via StorageClass.

### Key fields

| Field | Description |
|---|---|
| `apiVersion` | `v1` |
| `kind` | `PersistentVolume` / `PersistentVolumeClaim` |
| `spec.capacity` | storage size (e.g., `10Gi`) for PV/PVC |
| `spec.accessModes` | `ReadWriteOnce`, `ReadOnlyMany`, `ReadWriteMany` |
| `spec.persistentVolumeReclaimPolicy` | `Retain`, `Delete`, `Recycle` (PV) |
| `spec.storageClassName` | storage class for dynamic provisioning |

### Example PV (hostPath, for demo only)

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: pv-hostpath-demo
spec:
  capacity:
    storage: 5Gi
  accessModes:
    - ReadWriteOnce
  persistentVolumeReclaimPolicy: Retain
  storageClassName: manual
  hostPath:            # hostPath is only for single-node or dev clusters
    path: /mnt/data/pv-hostpath-demo
    type: DirectoryOrCreate
```

### Example PVC

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: pvc-demo
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
  storageClassName: manual
```

### Using PVC in a Pod (example)

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: pod-with-pvc
spec:
  containers:
    - name: app
      image: busybox
      command: ["/bin/sh", "-c", "sleep 3600"]
      volumeMounts:
        - mountPath: /data
          name: data-volume
  volumes:
    - name: data-volume
      persistentVolumeClaim:
        claimName: pvc-demo
```

### Common use cases
- Stateful applications (databases, message queues) that require durable storage.
- Shared volumes across pods when using ReadWriteMany capable storage.

### Best practices & considerations
- Prefer dynamic provisioning with StorageClasses in production.
- Use appropriate reclaim policy (`Delete` for dynamic provisioners you control, `Retain` when you want manual cleanup).
- Avoid `hostPath` in multi-node clusters unless intentionally using node-local storage; it binds data to a particular node.

---

# 8. Ingress

**Purpose:** Expose HTTP/S routes from outside the cluster to services inside the cluster. Ingress requires an Ingress Controller (NGINX, Traefik, cloud controllers).

### Key fields

| Field | Description |
|---|---|
| `apiVersion` | `networking.k8s.io/v1` (preferred) |
| `kind` | `Ingress` |
| `metadata` | `name`, `annotations` (controller-specific) |
| `spec.rules` | Host and path routing rules to backend services |
| `spec.tls` | TLS configuration: secretName with TLS certs |

### Example YAML (basic)

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: example-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: / # common nginx annotation
spec:
  tls:
    - hosts:
        - example.com
      secretName: example-tls  # Secret containing tls.crt and tls.key
  rules:
    - host: example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: example-clusterip
                port:
                  number: 80
```

### Common use cases
- Centralized HTTP(S) routing, virtual hosts, path-based routing, TLS termination.

### Best practices & considerations
- Use an appropriate Ingress Controller and follow its annotations for features (rate-limiting, rewrites, auth).
- Manage TLS certs with cert-manager or cloud-managed certificates.
- Prefer ClusterIP services as backends for Ingress.

---

# 9. StatefulSet

**Purpose:** Manage stateful applications that require stable network identities and persistent storage (e.g., databases). Provides stable Pod names, ordered deployment, and stable storage via PVC templates.

### Key fields

| Field | Description |
|---|---|
| `apiVersion` | `apps/v1` |
| `kind` | `StatefulSet` |
| `spec.serviceName` | governing headless Service used for network identity |
| `spec.replicas` | number of Pods |
| `spec.selector` | label selector |
| `spec.template` | pod template |
| `spec.volumeClaimTemplates` | PVC templates for per-pod persistent storage |

### Example YAML

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: example-statefulset
spec:
  serviceName: "example-headless" # headless service to govern network ids
  replicas: 3
  selector:
    matchLabels:
      app: example-stateful
  template:
    metadata:
      labels:
        app: example-stateful
    spec:
      containers:
        - name: postgres
          image: postgres:15
          ports:
            - containerPort: 5432
          env:
            - name: POSTGRES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: pg-secret
                  key: password
          volumeMounts:
            - name: pgdata
              mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
    - metadata:
        name: pgdata
      spec:
        accessModes: ["ReadWriteOnce"]
        resources:
          requests:
            storage: 10Gi
        storageClassName: standard
```

Also create the headless service used by the StatefulSet:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: example-headless
spec:
  clusterIP: None
  selector:
    app: example-stateful
  ports:
    - port: 5432
      targetPort: 5432
```

### Common use cases
- Databases (Postgres, MySQL), clustered systems (Zookeeper, Kafka) requiring stable identities and storage.

### Best practices & considerations
- Use `volumeClaimTemplates` for per-pod persistent storage so each pod has its own PVC.
- Plan for scaling down/up—stateful apps often need manual intervention for safe scaling.
- Understand node affinity and Pod anti-affinity to achieve availability across nodes.

---

# 10. DaemonSet

**Purpose:** Ensure a copy of a Pod runs on every node (or a subset using node selectors/taints). Ideal for node-level agents (logging, monitoring, network plugins).

### Key fields

| Field | Description |
|---|---|
| `apiVersion` | `apps/v1` |
| `kind` | `DaemonSet` |
| `spec.selector` | label selector |
| `spec.template` | pod template |
| `spec.updateStrategy` | RollingUpdate or OnDelete |

### Example YAML

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: node-exporter
  labels:
    app: node-exporter
spec:
  selector:
    matchLabels:
      app: node-exporter
  template:
    metadata:
      labels:
        app: node-exporter
    spec:
      hostNetwork: true # optional: use host network if required
      containers:
        - name: node-exporter
          image: prom/node-exporter:latest
          ports:
            - containerPort: 9100
              hostPort: 9100
              name: metrics
          volumeMounts:
            - name: proc
              mountPath: /host/proc
              readOnly: true
            - name: sys
              mountPath: /host/sys
              readOnly: true
      volumes:
        - name: proc
          hostPath:
            path: /proc
        - name: sys
          hostPath:
            path: /sys
```

### Common use cases
- Monitoring agents, log collectors (Fluentd), network plugins, storage drivers.

### Best practices & considerations
- Be careful with `hostPath` and `hostNetwork` — they increase privileges and risk.
- Use node selectors, tolerations, or affinity to control which nodes run daemon pods.
- Limit resource usage per daemon to avoid overloading nodes.

---

# Resource Limits and Requests

**Purpose:** `requests` indicate the resources the scheduler uses to place a pod; `limits` cap the resources a container may use.

### Key points
- `requests.cpu` and `requests.memory` affect bin-packing / scheduling.
- `limits.cpu` and `limits.memory` enforce runtime ceilings. CPU is throttled while memory overages cause OOM.
- Use `LimitRange` to define defaults and max/min per-namespace.

### Example snippet in a container spec

```yaml
resources:
  requests:
    cpu: "250m"    # 0.25 CPU
    memory: "256Mi"
  limits:
    cpu: "1"       # 1 CPU
    memory: "512Mi"
```

**Best practices:**
- Always set requests in production to avoid "noisy neighbor" scheduling problems.
- Use limits to protect nodes from runaway containers.
- Tune based on metrics and autoscaling needs.

---

# Probes (liveness, readiness, startup)

**Purpose:** Health checks for containers to determine lifecycle and traffic routing.

| Probe | Purpose |
|---|---|
| `livenessProbe` | Detects and restarts containers stuck or in crash-loop.
| `readinessProbe` | Controls whether Pod is ready to receive traffic. Failing readiness removes Pod from Service endpoints.
| `startupProbe` | For slow-starting applications; delays liveness checks until startup completes.

### Example probes

```yaml
readinessProbe:
  httpGet:
    path: /healthz
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 10
  failureThreshold: 3

livenessProbe:
  tcpSocket:
    port: 8080
  initialDelaySeconds: 15
  periodSeconds: 20

startupProbe:
  exec:
    command: ["/bin/check-startup.sh"]
  failureThreshold: 30
  periodSeconds: 10
```

**Best practices:**
- Use readiness probes to avoid serving traffic before an app is fully ready.
- Avoid overly aggressive probe settings that cause false positives.
- Combine `startupProbe` for apps that require long initialization (migrations, caches).

---

# Environment Variables

**Ways to inject env vars into containers:**
- `env` with `value` (literal)
- `envFrom` to load all keys from ConfigMap or Secret
- `env` with `valueFrom` referencing `configMapKeyRef` or `secretKeyRef`

### Examples

```yaml
containers:
  - name: app
    image: myapp:latest
    env:
      - name: LITERAL_VAR
        value: "literal-value"
      - name: FROM_CONFIGMAP
        valueFrom:
          configMapKeyRef:
            name: example-config
            key: APP_ENV
      - name: FROM_SECRET
        valueFrom:
          secretKeyRef:
            name: example-secret
            key: password
    envFrom:
      - configMapRef:
          name: example-config
      - secretRef:
          name: example-secret
```

**Best practices:**
- Keep secrets out of plain `env` values in YAML; prefer `secretKeyRef` or `envFrom: secretRef`.
- Avoid massive `envFrom` on large ConfigMaps/Secrets to reduce accidental exposure.

---

# Volume Mounts

**Common volume types and examples:**

### `emptyDir` (ephemeral per-Pod)

```yaml
volumes:
  - name: tmp-storage
    emptyDir: {}
```

### `hostPath` (node-local; use with caution)

```yaml
volumes:
  - name: host-logs
    hostPath:
      path: /var/log/myapp
      type: DirectoryOrCreate
```

### `persistentVolumeClaim` (durable storage)

```yaml
volumes:
  - name: data-volume
    persistentVolumeClaim:
      claimName: pvc-demo
```

### Mounting into containers

```yaml
volumeMounts:
  - name: data-volume
    mountPath: /data
```


**Best practices:**
- Use `emptyDir` for scratch space that does not need to survive Pod restarts.
- Avoid `hostPath` unless you specifically need node-local access and understand security implications.
- Use PVCs backed by cloud or network storage for production durability.

---

# Quick Reference / Cheatsheet

- Use **Deployment** for stateless apps.
- Use **StatefulSet** for stateful apps needing stable identity/storage.
- Use **DaemonSet** for node-level agents.
- Use **Service (ClusterIP)** as default; put an **Ingress** in front for HTTP(S) external access.
- Use **ConfigMap** for non-sensitive config; **Secret** for sensitive data.
- Use **PVC + PV** for durable storage; configure StorageClass for dynamic provisioning.

---

# Appendix: Practical Tips

- Keep YAMLs small and modular: separate concerns (deployment, service, config) into files or kustomize overlays.
- Use labels and annotations consistently; prefer `app.kubernetes.io/name` and other standard label keys.
- Use Tools: `kubectl apply -f`, `kubectl diff -f`, `kubectl rollout status deployment/<name>`.
- Validate YAMLs with `kubectl apply --dry-run=client -f` and `kubeval` or `conftest` for policies.
- Secure cluster: enable RBAC, network policies, and secret encryption at rest.



# SecurityContext & PodSecurityContext

**Purpose:** Define privilege and access control settings for Pods and containers.

### Key fields

| Field | Description |
|---|---|
| `securityContext.runAsUser` | UID to run container process as |
| `securityContext.runAsGroup` | GID to run container process as |
| `securityContext.fsGroup` | GID applied to mounted volumes |
| `securityContext.privileged` | Run container in privileged mode |
| `securityContext.capabilities` | Add/remove Linux capabilities |

### Example YAML

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: securitycontext-demo
spec:
  securityContext:
    runAsUser: 1000     # applies to all containers by default
    fsGroup: 2000       # mounted volume group ownership
  containers:
    - name: app
      image: busybox
      command: ["sleep", "3600"]
      securityContext:
        allowPrivilegeEscalation: false
        capabilities:
          drop: ["ALL"]
          add: ["NET_BIND_SERVICE"]
```

**Best practices:**
- Drop all capabilities, add only required ones.
- Avoid privileged containers unless absolutely required.
- Run as non-root (set `runAsNonRoot: true`).
- Apply PodSecurityAdmission or PodSecurityPolicy (legacy) to enforce cluster-wide policies.

---

# Autoscaling

**Purpose:** Automatically scale pods based on resource usage or custom metrics.

### Horizontal Pod Autoscaler (HPA)

Scales pod replicas based on CPU/memory utilization or external/custom metrics.

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: example-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: example-deployment
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

### Vertical Pod Autoscaler (VPA)

Adjusts container requests/limits (requires VPA controller installed).

```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: example-vpa
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: example-deployment
  updatePolicy:
    updateMode: "Auto"
```

**Best practices:**
- Use HPA for scaling replicas of stateless workloads.
- Use VPA to optimize resource requests, especially for batch workloads.
- Avoid combining HPA and VPA on the same resource unless using advanced setups.

---

# NetworkPolicy

**Purpose:** Control traffic flow between pods and from/to external endpoints. Acts as a virtual firewall at the Pod level.

### Key fields

| Field | Description |
|---|---|
| `podSelector` | Select pods to apply the policy to |
| `policyTypes` | `Ingress`, `Egress`, or both |
| `ingress` | Allowed incoming connections |
| `egress` | Allowed outgoing connections |

### Example YAML (Ingress only)

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-frontend-to-backend
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes:
    - Ingress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: frontend
      ports:
        - protocol: TCP
          port: 80
```

**Best practices:**
- Default deny all traffic by applying a restrictive policy first.
- Open only necessary ports between namespaces and apps.
- Combine with CNI plugins supporting NetworkPolicy (Calico, Cilium, Weave Net).

---

# Jobs & CronJobs

**Purpose:** Run one-off tasks (Job) or scheduled tasks (CronJob).

### Job Example

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: example-job
spec:
  completions: 3 # run 3 pods successfully
  parallelism: 2 # run up to 2 at the same time
  template:
    spec:
      restartPolicy: OnFailure
      containers:
        - name: pi
          image: perl
          command: ["perl", "-Mbignum=bpi", "-wle", "print bpi(2000)"]
```

### CronJob Example

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: example-cronjob
spec:
  schedule: "*/5 * * * *" # every 5 minutes
  jobTemplate:
    spec:
      template:
        spec:
          restartPolicy: OnFailure
          containers:
            - name: hello
              image: busybox
              args:
                - /bin/sh
                - -c
                - date; echo Hello from CronJob
```

**Best practices:**
- Use Jobs for batch workloads and CronJobs for scheduled tasks.
- Limit history with `.spec.successfulJobsHistoryLimit` and `.spec.failedJobsHistoryLimit`.
- Monitor CronJobs with alerts for failed jobs.

---

# Quick Reference / Cheatsheet

- **Pod**: Single unit of deployment.
- **Deployment**: Stateless workloads with rolling updates.
- **StatefulSet**: Stateful workloads with stable storage and identity.
- **DaemonSet**: Run agents on every node.
- **Service (ClusterIP)**: Internal communication; combine with **Ingress** for external HTTP(S).
- **ConfigMap**: Non-sensitive config.
- **Secret**: Sensitive config (passwords, tokens).
- **PVC + PV**: Durable storage; use StorageClass for dynamic provisioning.
- **HPA**: Scale replicas horizontally.
- **VPA**: Adjust pod resource requests.
- **NetworkPolicy**: Control traffic flow.
- **Job/CronJob**: One-off or scheduled tasks.

---

# Appendix: Practical Tips

- Keep YAML modular; separate files for deployments, services, config.
- Use Kustomize, Helm, or GitOps tools for managing large configs.
- Apply labels consistently using [Kubernetes recommended labels](https://kubernetes.io/docs/concepts/overview/working-with-objects/common-labels/).
- Test configs with `kubectl apply --dry-run=client`.
- Secure your cluster: RBAC, NetworkPolicies, PodSecurity, Secret encryption.
- Monitor workloads with Prometheus, Grafana, and alerting.

---

_End of document_

