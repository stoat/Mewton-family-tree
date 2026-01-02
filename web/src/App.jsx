import { useEffect, useMemo, useState, useCallback } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  applyEdgeChanges,
  applyNodeChanges
} from "reactflow";
import "reactflow/dist/style.css";
import { v4 as uuid } from "uuid";

const API = import.meta.env.VITE_API_URL || "http://localhost:5175";

function personToNode(p) {
  return {
    id: p.id,
    position: { x: p.x ?? 0, y: p.y ?? 0 },
    data: { ...p },
    type: "default"
  };
}

function relToEdge(r) {
  const style =
    r.type === "partner"
      ? { strokeWidth: 2, strokeDasharray: "6 4" }
      : { strokeWidth: 2 };

  return {
    id: r.id,
    source: r.from,
    target: r.to,
    data: { ...r },
    style
  };
}

export default function App() {
  const [tree, setTree] = useState({ people: [], relationships: [], meta: { title: "Family Tree" } });

  const nodes = useMemo(() => tree.people.map(personToNode), [tree.people]);
  const edges = useMemo(() => tree.relationships.map(relToEdge), [tree.relationships]);

  useEffect(() => {
    fetch(`${API}/api/tree`)
      .then(r => r.json())
      .then(setTree)
      .catch(() => {});
  }, []);

  const persist = useCallback(async (nextTree) => {
    setTree(nextTree);
    try {
      await fetch(`${API}/api/tree`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextTree)
      });
    } catch {}
  }, []);

  const onNodesChange = useCallback((changes) => {
    const nextNodes = applyNodeChanges(changes, nodes);
    const nextPeople = nextNodes.map(n => ({
      ...n.data,
      id: n.id,
      x: n.position.x,
      y: n.position.y
    }));
    persist({ ...tree, people: nextPeople });
  }, [nodes, tree, persist]);

  const onEdgesChange = useCallback((changes) => {
    const nextEdges = applyEdgeChanges(changes, edges);
    const nextRelationships = nextEdges.map(e => ({
      id: e.id,
      type: e.data?.type ?? "parentChild",
      from: e.source,
      to: e.target
    }));
    persist({ ...tree, relationships: nextRelationships });
  }, [edges, tree, persist]);

  const addPerson = async () => {
    const displayName = prompt("Name?");
    if (!displayName) return;
    const p = {
      id: uuid(),
      displayName,
      birth: "",
      death: "",
      notes: "",
      x: Math.random() * 200,
      y: Math.random() * 200
    };
    persist({ ...tree, people: [...tree.people, p] });
  };

  const addRelationship = async (type) => {
    const from = prompt("From person id?");
    const to = prompt("To person id?");
    if (!from || !to) return;
    persist({
      ...tree,
      relationships: [...tree.relationships, { id: uuid(), type, from, to }]
    });
  };

  const editPerson = async () => {
    const id = prompt("Person id to edit?");
    if (!id) return;
    const p = tree.people.find(x => x.id === id);
    if (!p) return alert("Not found");
    const displayName = prompt("Name:", p.displayName) ?? p.displayName;
    const birth = prompt("Birth:", p.birth ?? "") ?? (p.birth ?? "");
    const death = prompt("Death:", p.death ?? "") ?? (p.death ?? "");
    const notes = prompt("Notes:", p.notes ?? "") ?? (p.notes ?? "");
    const nextPeople = tree.people.map(x => x.id === id ? { ...x, displayName, birth, death, notes } : x);
    persist({ ...tree, people: nextPeople });
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(tree, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tree.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: 10, display: "flex", gap: 8, alignItems: "center" }}>
        <strong>{tree.meta?.title ?? "Family Tree"}</strong>
        <button onClick={addPerson}>Add person</button>
        <button onClick={editPerson}>Edit person</button>
        <button onClick={() => addRelationship("parentChild")}>Add parent/child</button>
        <button onClick={() => addRelationship("partner")}>Add partner</button>
        <button onClick={exportJson}>Export JSON</button>
        <span style={{ marginLeft: "auto", opacity: 0.7 }}>
          Tip: drag nodes; delete edges with backspace after selecting
        </span>
      </div>

      <div style={{ flex: 1 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
        >
          <Background />
          <MiniMap />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}

