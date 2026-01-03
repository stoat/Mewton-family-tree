import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  applyEdgeChanges,
  applyNodeChanges,
  Handle,
  Position
} from "reactflow";
import "reactflow/dist/style.css";
import { v4 as uuid } from "uuid";

// Use relative URLs so nginx can proxy to the API
// This works in both dev and production without hardcoding IPs

function LoginModal({ onLogin }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });
      
      if (!res.ok) {
        setError("Invalid password");
        setLoading(false);
        return;
      }
      
      const data = await res.json();
      onLogin(data.token);
    } catch (err) {
      setError("Login failed: " + err.message);
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "#f5f5f5",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 2000
    }}>
      <div style={{
        background: "#fff",
        borderRadius: "8px",
        padding: "40px",
        maxWidth: "400px",
        width: "90%",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
      }}>
        <h1 style={{ marginTop: 0, textAlign: "center" }}>Family Tree</h1>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px" }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter password"
              disabled={loading}
              autoFocus
              style={{ 
                width: "100%", 
                padding: "10px", 
                borderRadius: "4px", 
                border: "1px solid #ccc", 
                boxSizing: "border-box",
                fontSize: "16px"
              }}
            />
          </div>
          
          {error && (
            <div style={{ color: "#f44336", marginBottom: "15px", textAlign: "center", fontSize: "14px" }}>
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "10px",
              background: loading ? "#ccc" : "#0066cc",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: loading ? "default" : "pointer",
              fontWeight: "bold",
              fontSize: "16px"
            }}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

function PersonNode({ data, isConnectable, onClick }) {
  return (
    <div onClick={onClick} style={{
      padding: "8px 12px",
      background: "#fff",
      border: "2px solid #1a192b",
      borderRadius: "8px",
      fontSize: "14px",
      minWidth: "100px",
      width: "auto",
      textAlign: "center",
      cursor: "pointer",
      transition: "all 0.2s",
      whiteSpace: "nowrap"
    }} onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 0 8px rgba(0,0,0,0.3)"} onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}>
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} />
      <div style={{ fontWeight: "bold", display: "block" }}>{data.displayName}</div>
      {data.birth && <div style={{ fontSize: "12px", opacity: 0.7, display: "block" }}>b. {data.birth}</div>}
      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} />
    </div>
  );
}

function EditModal({ person, onSave, onClose, tree, onDeleteRelationship }) {
  const [data, setData] = useState({
    id: person?.id || "",
    displayName: person?.displayName || "",
    birth: person?.birth || "",
    death: person?.death || "",
    notes: person?.notes || "",
    x: person?.x ?? 0,
    y: person?.y ?? 0
  });
  
  // Sync data when person changes
  useEffect(() => {
    if (person) {
      setData({
        id: person.id || "",
        displayName: person.displayName || "",
        birth: person.birth || "",
        death: person.death || "",
        notes: person.notes || "",
        x: person.x ?? 0,
        y: person.y ?? 0
      });
    }
  }, [person?.id]);
  
  const parentRelationships = useMemo(() => {
    if (!person) return [];
    return tree.relationships.filter(r => r.to === person.id && r.type === "parentChild");
  }, [person, tree.relationships]);

  const childRelationships = useMemo(() => {
    if (!person) return [];
    return tree.relationships.filter(r => r.from === person.id && r.type === "parentChild");
  }, [person, tree.relationships]);

  const partnerRelationships = useMemo(() => {
    if (!person) return [];
    return tree.relationships.filter(r => 
      (r.from === person.id || r.to === person.id) && r.type === "partner"
    );
  }, [person, tree.relationships]);

  const handleChange = (field, value) => {
    setData({ ...data, [field]: value });
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000
    }} onClick={onClose}>
      <div style={{
        background: "#fff",
        borderRadius: "8px",
        padding: "20px",
        maxWidth: "550px",
        width: "90%",
        maxHeight: "85vh",
        overflowY: "auto",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
      }} onClick={e => e.stopPropagation()}>
        <h2 style={{ marginTop: 0 }}>{data.displayName || "New Person"}</h2>
        
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px" }}>Name *</label>
          <input
            type="text"
            value={data.displayName}
            onChange={e => handleChange("displayName", e.target.value)}
            style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc", boxSizing: "border-box" }}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px" }}>
          <div>
            <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px" }}>Birth Year</label>
            <input
              type="text"
              placeholder="e.g., 1850"
              value={data.birth}
              onChange={e => handleChange("birth", e.target.value)}
              style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc", boxSizing: "border-box" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px" }}>Death Year</label>
            <input
              type="text"
              placeholder="e.g., 1920"
              value={data.death}
              onChange={e => handleChange("death", e.target.value)}
              style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc", boxSizing: "border-box" }}
            />
          </div>
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px" }}>Notes</label>
          <textarea
            value={data.notes}
            onChange={e => handleChange("notes", e.target.value)}
            style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc", boxSizing: "border-box", minHeight: "60px", fontFamily: "inherit", resize: "vertical" }}
          />
        </div>

        {parentRelationships.length > 0 && (
          <div style={{ marginBottom: "15px", padding: "10px", background: "#f0f0f0", borderRadius: "4px" }}>
            <div style={{ fontWeight: "bold", marginBottom: "8px" }}>Parents ({parentRelationships.length})</div>
            {parentRelationships.map(rel => {
              const parent = tree.people.find(p => p.id === rel.from);
              return (
                <div key={rel.id} style={{ fontSize: "14px", padding: "6px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>{parent?.displayName || rel.from}</span>
                  <button onClick={() => onDeleteRelationship(rel.id)} style={{ padding: "4px 8px", background: "#ff6b6b", color: "#fff", border: "none", borderRadius: "3px", cursor: "pointer", fontSize: "12px" }}>Remove</button>
                </div>
              );
            })}
          </div>
        )}

        {childRelationships.length > 0 && (
          <div style={{ marginBottom: "15px", padding: "10px", background: "#f0f0f0", borderRadius: "4px" }}>
            <div style={{ fontWeight: "bold", marginBottom: "8px" }}>Children ({childRelationships.length})</div>
            {childRelationships.map(rel => {
              const child = tree.people.find(p => p.id === rel.to);
              return (
                <div key={rel.id} style={{ fontSize: "14px", padding: "6px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>{child?.displayName || rel.to}</span>
                  <button onClick={() => onDeleteRelationship(rel.id)} style={{ padding: "4px 8px", background: "#ff6b6b", color: "#fff", border: "none", borderRadius: "3px", cursor: "pointer", fontSize: "12px" }}>Remove</button>
                </div>
              );
            })}
          </div>
        )}

        {partnerRelationships.length > 0 && (
          <div style={{ marginBottom: "15px", padding: "10px", background: "#f0f0f0", borderRadius: "4px" }}>
            <div style={{ fontWeight: "bold", marginBottom: "8px" }}>Partners ({partnerRelationships.length})</div>
            {partnerRelationships.map(rel => {
              const partnerId = rel.from === person.id ? rel.to : rel.from;
              const partner = tree.people.find(p => p.id === partnerId);
              return (
                <div key={rel.id} style={{ fontSize: "14px", padding: "6px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>{partner?.displayName || partnerId}</span>
                  <button onClick={() => onDeleteRelationship(rel.id)} style={{ padding: "4px 8px", background: "#ff6b6b", color: "#fff", border: "none", borderRadius: "3px", cursor: "pointer", fontSize: "12px" }}>Remove</button>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => onSave(data)} style={{ flex: 1, padding: "10px", background: "#0066cc", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>Save</button>
          <button onClick={onClose} style={{ flex: 1, padding: "10px", background: "#ccc", border: "none", borderRadius: "4px", cursor: "pointer" }}>Close</button>
        </div>
      </div>
    </div>
  );
}

function PersonSearch({ value, onChange, tree, excludeId }) {
  const [open, setOpen] = useState(false);
  
  const filtered = useMemo(() => {
    const query = value.toLowerCase();
    return tree.people
      .filter(p => p.id !== excludeId && p.displayName.toLowerCase().includes(query))
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [value, tree.people, excludeId]);

  return (
    <div style={{ position: "relative" }}>
      <input
        type="text"
        placeholder="Search by name..."
        value={value}
        onChange={e => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc", boxSizing: "border-box" }}
      />
      {open && filtered.length > 0 && (
        <div style={{
          position: "absolute",
          top: "100%",
          left: 0,
          right: 0,
          background: "#fff",
          border: "1px solid #ccc",
          borderTop: "none",
          borderRadius: "0 0 4px 4px",
          maxHeight: "200px",
          overflowY: "auto",
          zIndex: 1002,
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
        }}>
          {filtered.map(p => (
            <div
              key={p.id}
              onClick={() => {
                onChange(p.id);
                setOpen(false);
              }}
              style={{
                padding: "10px",
                cursor: "pointer",
                borderBottom: "1px solid #eee"
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#f5f5f5"}
              onMouseLeave={e => e.currentTarget.style.background = "#fff"}
            >
              {p.displayName}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RelationshipManager({ tree, onAddRelationship, onRemoveRelationship }) {
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [relType, setRelType] = useState("parentChild");

  const handleAdd = () => {
    if (fromId && toId && fromId !== toId) {
      onAddRelationship({ id: uuid(), type: relType, from: fromId, to: toId });
      setFromId("");
      setToId("");
    }
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1001
    }} onClick={() => onAddRelationship(null)}>
      <div style={{
        background: "#fff",
        borderRadius: "8px",
        padding: "20px",
        maxWidth: "500px",
        width: "90%",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
      }} onClick={e => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>Add Relationship</h3>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px" }}>From Person</label>
          <PersonSearch value={fromId} onChange={setFromId} tree={tree} excludeId={toId} />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px" }}>Relationship Type</label>
          <select
            value={relType}
            onChange={e => setRelType(e.target.value)}
            style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc", boxSizing: "border-box" }}
          >
            <option value="parentChild">Parent → Child</option>
            <option value="partner">Partner</option>
          </select>
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", fontWeight: "bold", marginBottom: "5px" }}>To Person</label>
          <PersonSearch value={toId} onChange={setToId} tree={tree} excludeId={fromId} />
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={handleAdd} style={{ flex: 1, padding: "10px", background: "#4CAF50", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>Add</button>
          <button onClick={() => onAddRelationship(null)} style={{ flex: 1, padding: "10px", background: "#ccc", border: "none", borderRadius: "4px", cursor: "pointer" }}>Close</button>
        </div>
      </div>
    </div>
  );
}

function Timeline({ person, tree }) {
  const events = useMemo(() => {
    const result = [];
    if (person.birth) result.push({ year: parseInt(person.birth), type: "birth", label: "Born" });
    
    tree.relationships
      .filter(r => (r.from === person.id || r.to === person.id) && r.type === "partner")
      .forEach(r => {
        const partnerId = r.from === person.id ? r.to : r.from;
        const partner = tree.people.find(p => p.id === partnerId);
        if (partner) {
          const year = partner.birth ? parseInt(partner.birth) : null;
          if (year) result.push({ year, type: "marriage", label: `Married ${partner.displayName}` });
        }
      });
    
    if (person.death) result.push({ year: parseInt(person.death), type: "death", label: "Died" });
    
    return result.sort((a, b) => a.year - b.year);
  }, [person, tree]);

  return (
    <div style={{ padding: "15px", background: "#f9f9f9", borderRadius: "8px" }}>
      <h3 style={{ marginTop: 0 }}>Timeline</h3>
      {events.length === 0 ? (
        <p style={{ opacity: 0.6, margin: 0 }}>No timeline events</p>
      ) : (
        <div style={{ position: "relative", paddingLeft: "30px" }}>
          {events.map((event, idx) => (
            <div key={idx} style={{ marginBottom: "15px", position: "relative" }}>
              <div style={{
                position: "absolute",
                left: "-30px",
                top: "2px",
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                background: event.type === "birth" ? "#4CAF50" : event.type === "death" ? "#f44336" : "#2196F3"
              }} />
              <div style={{ fontWeight: "bold" }}>{event.year}: {event.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function personToNode(p) {
  return {
    id: p.id,
    position: { x: p.x ?? 0, y: p.y ?? 0 },
    data: { ...p },
    type: "person",
    style: {
      width: "140px",
      height: "auto",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
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
  const [editingPerson, setEditingPerson] = useState(null);
  const [showRelManager, setShowRelManager] = useState(false);
  const [token, setToken] = useState(localStorage.getItem("tree_token"));
  const saveTimeoutRef = useRef(null);

  const nodes = useMemo(() => tree.people.map(p => {
    const node = personToNode(p);
    return {
      ...node,
      draggable: true,
      data: { ...node.data, onClick: () => setEditingPerson(p) }
    };
  }), [tree.people]);
  
  const edges = useMemo(() => tree.relationships.map(relToEdge), [tree.relationships]);
  
  const nodeTypes = useMemo(() => ({
    person: (props) => <PersonNode {...props} onClick={() => setEditingPerson(props.data)} />
  }), []);

  useEffect(() => {
    if (!token) return;
    
    fetch("/api/tree", {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(r => {
        if (r.status === 401) {
          setToken(null);
          localStorage.removeItem("tree_token");
          return;
        }
        return r.json();
      })
      .then(data => data && setTree(data))
      .catch(err => console.error("Failed to load tree:", err));
  }, [token]);

  const persist = useCallback(async (nextTree) => {
    if (!token) return;
    
    setTree(nextTree);
    try {
      await fetch("/api/tree", {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(nextTree)
      });
    } catch (err) {
      console.error("Failed to save tree:", err);
    }
  }, [token]);

  const onNodesChange = useCallback((changes) => {
    if (!token) return;
    
    setTree(currentTree => {
      const currentNodes = currentTree.people.map(p => personToNode(p));
      const nextNodes = applyNodeChanges(changes, currentNodes);
      const nextPeople = nextNodes.map(n => {
        const original = currentTree.people.find(p => p.id === n.id);
        if (!original) return null;
        return {
          ...original,
          x: n.position.x,
          y: n.position.y
        };
      }).filter(Boolean);
      
      const updatedTree = { ...currentTree, people: nextPeople };
      
      // Debounce position saves - only persist every 500ms during drag
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        fetch("/api/tree", {
          method: "PUT",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(updatedTree)
        }).catch(err => console.error("Failed to save positions:", err));
      }, 500);
      
      return updatedTree;
    });
  }, [token]);

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

  const savePerson = (updatedPerson) => {
    const nextPeople = tree.people.map(p => p.id === updatedPerson.id ? updatedPerson : p);
    persist({ ...tree, people: nextPeople });
    setEditingPerson(null);
  };

  const addRelationship = (newRel) => {
    if (!newRel) {
      setShowRelManager(false);
      return;
    }
    console.log("Adding relationship:", newRel);
    const updated = {
      ...tree,
      relationships: [...tree.relationships, newRel]
    };
    console.log("Updated tree with", updated.relationships.length, "relationships");
    persist(updated);
    setShowRelManager(false);
  };

  const removeRelationship = (relId) => {
    const updated = {
      ...tree,
      relationships: tree.relationships.filter(r => r.id !== relId)
    };
    persist(updated);
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

  const handleLogin = (newToken) => {
    setToken(newToken);
    localStorage.setItem("tree_token", newToken);
  };

  if (!token) {
    return <LoginModal onLogin={handleLogin} />;
  }

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: 10, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <strong>{tree.meta?.title ?? "Family Tree"}</strong>
        <button onClick={addPerson}>Add person</button>
        <button onClick={() => setShowRelManager(true)}>Add relationship</button>
        <button onClick={exportJson}>Export JSON</button>
        <button onClick={() => { setToken(null); localStorage.removeItem("tree_token"); }} style={{ marginLeft: "auto", padding: "5px 10px", background: "#f44336", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>Logout</button>
        <span style={{ opacity: 0.7 }}>
          Click a person to edit • Drag to move • Delete edges with backspace

        </span>
      </div>

      <div style={{ flex: 1, display: "flex" }}>
        <div style={{ flex: 1, position: "relative", width: "100%", height: "100%", minHeight: 0 }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            nodesDraggable={true}
            fitView
            panOnScroll={true}
            panOnDrag={true}
            proOptions={{ hideAttribution: true }}
          >
            <Background />
            <MiniMap />
            <Controls />
          </ReactFlow>
        </div>
        
        {editingPerson && (
          <div style={{ width: "350px", borderLeft: "1px solid #ddd", display: "flex", flexDirection: "column" }}>
            <div style={{ flex: 1, overflowY: "auto", padding: "15px" }}>
              <Timeline person={editingPerson} tree={tree} />
            </div>
          </div>
        )}
      </div>

      {editingPerson && (
        <EditModal
          person={tree.people.find(p => p.id === editingPerson.id) || editingPerson}
          onSave={savePerson}
          onClose={() => setEditingPerson(null)}
          tree={tree}
          onDeleteRelationship={removeRelationship}
        />
      )}

      {showRelManager && (
        <RelationshipManager
          tree={tree}
          onAddRelationship={addRelationship}
          onRemoveRelationship={removeRelationship}
        />
      )}
    </div>
  );
}

