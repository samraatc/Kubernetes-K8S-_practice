# Kubernetes (k8s) Command Reference Guide

## Core Components & Elements

| Component / Element | Description |
| :--- | :--- |
| **Pod** | The smallest deployable unit. A group of one or more containers with shared storage/network. |
| **Deployment** | A controller that manages a set of identical Pods, providing declarative updates, scaling, and rollbacks. |
| **Service** | An abstraction to expose an application running on a set of Pods as a network service (stable IP/DNS). |
| **ConfigMap** | Used to store non-confidential configuration data in key-value pairs. Pods can consume them. |
| **Secret** | Similar to ConfigMap but for storing sensitive information (passwords, tokens, keys) in an encoded format. |
| **Namespace** | A virtual cluster inside a physical cluster. Used to isolate resources (e.g., `dev`, `staging`, `production`). |
| **Node** | A worker machine (VM or physical) in the cluster where Pods are scheduled. |
| **PersistentVolume (PV)** | A piece of storage in the cluster, provisioned by an administrator or dynamically. |
| **PersistentVolumeClaim (PVC)** | A request for storage by a user. It claims a PV that meets its size and access mode requirements. |
| **Ingress** | An API object that manages external access to services in a cluster, typically HTTP/HTTPS, providing routing. |
| **StatefulSet** | A workload API object used to manage stateful applications, offering ordering and uniqueness guarantees. |
| **DaemonSet** | Ensures a copy of a Pod runs on all (or some) Nodes. Perfect for node-level services like log collectors. |

## Commands by Use Case

### Use Case 1: Basic Create, Read, Update, Delete (CRUD) Operations

| Command & Example | Description |
| :--- | :--- |
| **`kubectl apply -f <file.yaml>`** <br/> `kubectl apply -f my-deployment.yaml` | **Create/Update** resources defined in a YAML/JSON file. The standard declarative command. |
| **`kubectl create -f <file.yaml>`** <br/> `kubectl create -f my-pod.yaml` | **Create** resources from a file (imperative). Fails if the resource already exists. |
| **`kubectl get <resource>`** <br/> `kubectl get pods` <br/> `kubectl get svc,deploy` <br/> `kubectl get pods -n my-namespace` | **List** one or more resources. |
| **`kubectl describe <resource>/<name>`** <br/> `kubectl describe pod/my-pod` | Show **detailed information** about a specific resource, including events. |
| **`kubectl delete -f <file.yaml>`** <br/> `kubectl delete -f my-deployment.yaml` | **Delete** resources defined in a file. |
| **`kubectl delete <resource>/<name>`** <br/> `kubectl delete pod/my-old-pod` | **Delete** a specific resource by its type and name. |

### Use Case 2: Troubleshooting & Debugging

| Command & Example | Description |
| :--- | :--- |
| **`kubectl logs <pod-name>`** <br/> `kubectl logs my-pod-xyz123` <br/> `kubectl logs my-pod -c my-container` | **Print the logs** from a container in a pod. Use `-c` if the pod has multiple containers. |
| **`kubectl exec -it <pod-name> -- <command>`** <br/> `kubectl exec -it my-pod -- /bin/sh` <br/> `kubectl exec -it my-pod -c container2 -- /bin/bash` | **Execute a command** in a running container. The `-it` flags give you an interactive shell. |
| **`kubectl port-forward <pod-name> <local-port>:<pod-port>`** <br/> `kubectl port-forward my-pod 8080:80` | **Forward a local port** to a port on a Pod. Great for testing services that aren't publicly exposed. |
| **`kubectl top pod` / `kubectl top node`** <br/> `kubectl top pod --namespace my-ns` | **Display resource usage** (CPU/Memory) of pods or nodes. Requires metrics-server installed. |

### Use Case 3: Monitoring & Context

| Command & Example | Description |
| :--- | :--- |
| **`kubectl get events --sort-by=.metadata.creationTimestamp`** <br/> `kubectl get events -A --sort-by=.lastTimestamp` | **List events** from all namespaces, sorted by time. Crucial for debugging. |
| **`kubectl cluster-info`** | **Display addresses** of the master and services in the cluster. |
| **`kubectl config current-context`** | **Show the current context** (which cluster/user/namespace you are using). |
| **`kubectl config use-context <context-name>`** <br/> `kubectl config use-context my-dev-cluster` | **Switch to a different context** (e.g., to a different cluster or namespace). |
| **`kubectl get nodes -o wide`** | **List nodes** with additional information (IP addresses, OS, Kubernetes version). |

### Use Case 4: Scaling & Rolling Updates

| Command & Example | Description |
| :--- | :--- |
| **`kubectl scale --replicas=<count> <resource>/<name>`** <br/> `kubectl scale --replicas=3 deployment/my-app` | **Scale a deployment** up or down by changing the number of replicas. |
| **`kubectl rollout status deployment/<name>`** <br/> `kubectl rollout status deployment/my-app` | **Watch the status** of a rolling update until it completes. |
| **`kubectl rollout history deployment/<name>`** | **Show the history** of revisions and updates for a deployment. |
| **`kubectl rollout undo deployment/<name>`** <br/> `kubectl rollout undo deployment/my-app` | **Rollback a deployment** to the previous revision. |
| **`kubectl rollout undo deployment/<name> --to-revision=<number>`** <br/> `kubectl rollout undo deployment/my-app --to-revision=2` | **Rollback to a specific revision** number. |

## Common Flags & Their Uses

| Flag | Example | Description |
| :--- | :--- | :--- |
| **`-n, --namespace`** | `kubectl get pods -n my-namespace` | Perform an operation in a specific namespace. |
| **`-A, --all-namespaces`** | `kubectl get pods -A` | Perform an operation across **all** namespaces. |
| **`-o, --output`** | `kubectl get pods -o wide` <br/> `kubectl get svc -o yaml` <br/> `kubectl get nodes -o json` | Control the output format. Common values: `wide` (more info), `yaml`, `json`, `name` (just names). |
| **`-l, --selector`** | `kubectl get pods -l app=nginx` | Filter objects based on their **labels**. |
| **`--dry-run=client`** | `kubectl create deployment my-dep --image=nginx --dry-run=client -o yaml` | Simulate a command. Doesn't submit to the server. Perfect for generating a YAML template. |
| **`-f, --filename`** | `kubectl apply -f my-file.yaml` <br/> `kubectl apply -f ./my-dir/` | Specify a file or directory containing resource definitions. |
| **`-it`** | `kubectl exec -it my-pod -- /bin/sh` | **Interactive TTY**. Used with `exec` and `run` to get an interactive shell. (`-i` for stdin, `-t` for tty). |
| **`--record`** | `kubectl create deployment my-dep --image=nginx --record` | **(Deprecated but historically important)** Record the current command in the resource annotation. Used for tracking change causes in `rollout history`. Modern `kubectl` versions may do this by default. Use `kubectl apply` instead. |
| **`--force`** | `kubectl delete pod my-pod --force` | Force delete a resource immediately (bypass graceful deletion). Use with caution. |
| **`-k, --kustomize`** | `kubectl apply -k ./overlays/production/` | Apply resources from a **kustomization.yaml** file (for Kubernetes-native templating). |
| **`--sort-by`** | `kubectl get pods --sort-by=.status.startTime` | Sort list output by a specified JSONPath field. |

## Quick Example Workflow

1.  **Create a Deployment from a file:**
    ```bash
    kubectl apply -f deployment.yaml
    ```

2.  **Check if the Pods are running:**
    ```bash
    kubectl get pods -l app=my-app
    ```

3.  **Expose the Deployment as a Service:**
    ```bash
    kubectl expose deployment my-app --port=80 --target-port=8080 --type=LoadBalancer
    ```

4.  **Check the Service and get its external IP:**
    ```bash
    kubectl get svc my-app
    ```

5.  **Check the logs of a Pod if there's an issue:**
    ```bash
    kubectl logs my-app-pod-xyz123
    ```

6.  **Scale the application:**
    ```bash
    kubectl scale deployment my-app --replicas=5
    ```

7.  **Update the image version:**
    ```bash
    kubectl set image deployment/my-app my-app-container=my-app:2.0.0
    ```

8.  **Monitor the rollout:**
    ```bash
    kubectl rollout status deployment/my-app
    ```

9.  **Rollback if something goes wrong:**
    ```bash
    kubectl rollout undo deployment/my-app
    ```

---

*Document generated on: 2023-11-07*