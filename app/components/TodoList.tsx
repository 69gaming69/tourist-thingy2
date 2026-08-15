"use client";

import { useState } from "react";

type TodoItem = {
  id: number;
  name: string;
  is_complete: boolean;
};

const INITIAL_TODOS: TodoItem[] = [
  { id: 1, name: "Visit Phuket Old Town", is_complete: false },
  { id: 2, name: "Relax at Patong Beach", is_complete: true },
  { id: 3, name: "See Big Buddha Phuket", is_complete: false },
];

export default function TodoList() {
  const [todos, setTodos] = useState<TodoItem[]>(INITIAL_TODOS);
  const [newTodo, setNewTodo] = useState("");
  const [error, setError] = useState<string | null>(null);

  // TODO: Wire up Supabase. Replace these with real @supabase/ssr calls.
  const persistTodos = () => Promise.resolve();

  const addTodo = async () => {
    const name = newTodo.trim();
    if (!name) return;
    await persistTodos();
    setTodos((prev) => [
      ...prev,
      { id: Date.now(), name, is_complete: false },
    ]);
    setNewTodo("");
  };

  const toggleTodo = async (id: number) => {
    await persistTodos();
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, is_complete: !todo.is_complete } : todo
      )
    );
  };

  const deleteTodo = async (id: number) => {
    await persistTodos();
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  };

  return (
    <div className="space-y-4">
      {/* Add todo input */}
      <div className="flex gap-3">
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTodo()}
          placeholder="Add a new todo..."
          className="w-full rounded-2xl border border-slate-200/80 bg-[#edf7ed] px-5 py-3.5 text-sm text-slate-900 outline-none transition duration-200 shadow-[inset_0_2px_6px_rgba(15,23,42,0.06)] placeholder:text-slate-400 focus:border-emerald-300 focus:shadow-[inset_0_2px_6px_rgba(16,185,129,0.12),0_0_0_3px_rgba(16,185,129,0.12)]"
        />
        <button
          type="button"
          onClick={addTodo}
          className="flex-none rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 px-5 py-3.5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(16,185,129,0.25),inset_0_1px_0_rgba(255,255,255,0.3)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_32px_rgba(16,185,129,0.3)] active:translate-y-0"
        >
          Add
        </button>
      </div>

      {error && (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {/* Todo list */}
      {todos.length === 0 ? (
        <p className="rounded-[20px] border border-slate-200 bg-[#f8fbff] px-4 py-8 text-center text-sm text-slate-500">
          No todos yet. Add one above!
        </p>
      ) : (
        <ul className="space-y-2.5">
          {todos.map((todo) => (
            <li
              key={todo.id}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-[#f8fbff] px-4 py-3 shadow-[inset_2px_2px_6px_rgba(15,23,42,0.04),inset_-2px_-2px_6px_rgba(255,255,255,0.9)]"
            >
              <button
                type="button"
                onClick={() => toggleTodo(todo.id)}
                aria-label={todo.is_complete ? "Mark incomplete" : "Mark complete"}
                className={`flex h-6 w-6 flex-none items-center justify-center rounded-lg border-2 transition-all duration-200 ${
                  todo.is_complete
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-slate-300 bg-white text-transparent hover:border-emerald-400"
                }`}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </button>

              <span
                className={`flex-1 text-sm transition-all duration-200 ${
                  todo.is_complete
                    ? "text-slate-400 line-through"
                    : "text-slate-900"
                }`}
              >
                {todo.name}
              </span>

              <button
                type="button"
                onClick={() => deleteTodo(todo.id)}
                aria-label="Delete todo"
                className="flex h-8 w-8 flex-none items-center justify-center rounded-xl text-slate-400 transition-all duration-200 hover:bg-red-50 hover:text-red-500"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
