"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface TestCase {
  id?: string;
  input: string;
  output: string;
  expectedOutputs?: string[];
  isHidden: boolean;
  orderIndex: number;
}

interface Example {
  input: string;
  output: string;
  explanation: string | null;
}

interface ProblemData {
  id?: string;
  slug: string;
  title: string;
  description: string;
  difficulty: string;
  tags: string[];
  companies: string[];
  constraints: string[];
  hints: string[];
  examples: Example[];
  inputFormat: string;
  outputFormat: string;
  timeLimit: number;
  memoryLimit: number;
  publishedAt: string | null;
  isPremium: boolean;
  testCases: TestCase[];
}

export default function ProblemForm({ problem }: { problem?: ProblemData }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ProblemData>(
    problem || {
      slug: "",
      title: "",
      description: "",
      difficulty: "EASY",
      tags: [],
      companies: [],
      constraints: [],
      hints: [],
      examples: [],
      inputFormat: "",
      outputFormat: "",
      timeLimit: 2000,
      memoryLimit: 256000,
      publishedAt: null,
      isPremium: false,
      testCases: [],
    },
  );

  const [tagInput, setTagInput] = useState("");
  const [companyInput, setCompanyInput] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = problem
        ? `/api/admin/problems/${problem.id}`
        : "/api/admin/problems";
      const method = problem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/admin/problems/${data.slug}`);
        router.refresh();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to save problem");
      }
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag),
    });
  };

  const addCompany = () => {
    if (
      companyInput.trim() &&
      !formData.companies.includes(companyInput.trim())
    ) {
      setFormData({
        ...formData,
        companies: [...formData.companies, companyInput.trim()],
      });
      setCompanyInput("");
    }
  };

  const removeCompany = (company: string) => {
    setFormData({
      ...formData,
      companies: formData.companies.filter(c => c !== company),
    });
  };

  const addConstraint = () => {
    setFormData({
      ...formData,
      constraints: [...formData.constraints, ""],
    });
  };

  const updateConstraint = (index: number, value: string) => {
    const newConstraints = [...formData.constraints];
    newConstraints[index] = value;
    setFormData({ ...formData, constraints: newConstraints });
  };

  const removeConstraint = (index: number) => {
    setFormData({
      ...formData,
      constraints: formData.constraints.filter((_, i) => i !== index),
    });
  };

  const addHint = () => {
    setFormData({
      ...formData,
      hints: [...formData.hints, ""],
    });
  };

  const updateHint = (index: number, value: string) => {
    const newHints = [...formData.hints];
    newHints[index] = value;
    setFormData({ ...formData, hints: newHints });
  };

  const removeHint = (index: number) => {
    setFormData({
      ...formData,
      hints: formData.hints.filter((_, i) => i !== index),
    });
  };

  const addExample = () => {
    setFormData({
      ...formData,
      examples: [
        ...formData.examples,
        { input: "", output: "", explanation: null },
      ],
    });
  };

  const updateExample = (
    index: number,
    field: keyof Example,
    value: string,
  ) => {
    const newExamples = [...formData.examples];
    newExamples[index] = { ...newExamples[index], [field]: value };
    setFormData({ ...formData, examples: newExamples });
  };

  const removeExample = (index: number) => {
    setFormData({
      ...formData,
      examples: formData.examples.filter((_, i) => i !== index),
    });
  };

  const addTestCase = () => {
    setFormData({
      ...formData,
      testCases: [
        ...formData.testCases,
        {
          input: "",
          output: "",
          expectedOutputs: [],
          isHidden: false,
          orderIndex: formData.testCases.length,
        },
      ],
    });
  };

  const updateTestCase = (
    index: number,
    field: keyof TestCase,
    value: unknown,
  ) => {
    const newTestCases = [...formData.testCases];
    newTestCases[index] = { ...newTestCases[index], [field]: value };
    setFormData({ ...formData, testCases: newTestCases });
  };

  const removeTestCase = (index: number) => {
    setFormData({
      ...formData,
      testCases: formData.testCases
        .filter((_, i) => i !== index)
        .map((tc, i) => ({ ...tc, orderIndex: i })),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Info */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Basic Information
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={e =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Slug *
            </label>
            <input
              type="text"
              required
              value={formData.slug}
              onChange={e =>
                setFormData({
                  ...formData,
                  slug: e.target.value.toLowerCase().replace(/\s+/g, "-"),
                })
              }
              className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Description * (Markdown supported)
          </label>
          <textarea
            required
            rows={8}
            value={formData.description}
            onChange={e =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white font-mono text-sm"
          />
        </div>

        <div className="grid grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Difficulty *
            </label>
            <select
              value={formData.difficulty}
              onChange={e =>
                setFormData({ ...formData, difficulty: e.target.value })
              }
              className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white">
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Time Limit (ms)
              <span className="text-slate-500 text-xs ml-2">
                Minimum: 100ms
              </span>
            </label>
            <input
              type="number"
              min="100"
              value={formData.timeLimit}
              onChange={e =>
                setFormData({
                  ...formData,
                  timeLimit: parseInt(e.target.value),
                })
              }
              className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Memory Limit (KB)
              <span className="text-slate-500 text-xs ml-2">
                Minimum: 128KB
              </span>
            </label>
            <input
              type="number"
              min="128"
              value={formData.memoryLimit}
              onChange={e =>
                setFormData({
                  ...formData,
                  memoryLimit: parseInt(e.target.value),
                })
              }
              className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white"
            />
          </div>
        </div>

        {/* Premium & Publish Status */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isPremium"
              checked={formData.isPremium}
              onChange={e =>
                setFormData({ ...formData, isPremium: e.target.checked })
              }
              className="w-4 h-4 bg-slate-900 border-slate-700 rounded text-purple-600 focus:ring-purple-500"
            />
            <label
              htmlFor="isPremium"
              className="text-sm font-medium text-slate-300 cursor-pointer">
              Premium Problem (requires Pro subscription)
            </label>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="publishNow"
              checked={formData.publishedAt !== null}
              onChange={e =>
                setFormData({
                  ...formData,
                  publishedAt: e.target.checked
                    ? new Date().toISOString()
                    : null,
                })
              }
              className="w-4 h-4 bg-slate-900 border-slate-700 rounded text-purple-600 focus:ring-purple-500"
            />
            <label
              htmlFor="publishNow"
              className="text-sm font-medium text-slate-300 cursor-pointer">
              Published{" "}
              {formData.publishedAt &&
                `(${new Date(formData.publishedAt).toLocaleDateString()})`}
            </label>
          </div>
        </div>
      </div>

      {/* Tags & Companies */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Tags & Companies
        </h2>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyPress={e =>
                  e.key === "Enter" && (e.preventDefault(), addTag())
                }
                placeholder="Enter tag and press Enter"
                className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white text-sm"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm">
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map(tag => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-sm flex items-center gap-1">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-blue-300">
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Companies
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={companyInput}
                onChange={e => setCompanyInput(e.target.value)}
                onKeyPress={e =>
                  e.key === "Enter" && (e.preventDefault(), addCompany())
                }
                placeholder="Enter company and press Enter"
                className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white text-sm"
              />
              <button
                type="button"
                onClick={addCompany}
                className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm">
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.companies.map(company => (
                <span
                  key={company}
                  className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-sm flex items-center gap-1">
                  {company}
                  <button
                    type="button"
                    onClick={() => removeCompany(company)}
                    className="hover:text-purple-300">
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* I/O Format */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Input/Output Format
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Input Format
            </label>
            <textarea
              rows={4}
              value={formData.inputFormat}
              onChange={e =>
                setFormData({ ...formData, inputFormat: e.target.value })
              }
              className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white text-sm"
              placeholder="Describe the input format..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Output Format
            </label>
            <textarea
              rows={4}
              value={formData.outputFormat}
              onChange={e =>
                setFormData({ ...formData, outputFormat: e.target.value })
              }
              className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white text-sm"
              placeholder="Describe the output format..."
            />
          </div>
        </div>
      </div>

      {/* Constraints */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Constraints</h2>
          <button
            type="button"
            onClick={addConstraint}
            className="text-sm text-blue-400 hover:text-blue-300">
            + Add Constraint
          </button>
        </div>

        <div className="space-y-2">
          {formData.constraints.map((constraint, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={constraint}
                onChange={e => updateConstraint(index, e.target.value)}
                placeholder="e.g., 1 <= n <= 10^5"
                className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white text-sm"
              />
              <button
                type="button"
                onClick={() => removeConstraint(index)}
                className="px-3 py-2 text-red-400 hover:text-red-300">
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Hints */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Hints</h2>
          <button
            type="button"
            onClick={addHint}
            className="text-sm text-blue-400 hover:text-blue-300">
            + Add Hint
          </button>
        </div>

        <div className="space-y-2">
          {formData.hints.map((hint, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={hint}
                onChange={e => updateHint(index, e.target.value)}
                placeholder="Enter hint..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white text-sm"
              />
              <button
                type="button"
                onClick={() => removeHint(index)}
                className="px-3 py-2 text-red-400 hover:text-red-300">
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Examples */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">
            Examples (for UI display)
          </h2>
          <button
            type="button"
            onClick={addExample}
            className="text-sm text-blue-400 hover:text-blue-300">
            + Add Example
          </button>
        </div>

        <div className="space-y-4">
          {formData.examples.map((example, index) => (
            <div key={index} className="border border-slate-700 rounded p-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-slate-400">
                  Example {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeExample(index)}
                  className="text-sm text-red-400 hover:text-red-300">
                  Remove
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Input (press Enter for new lines)
                  </label>
                  <textarea
                    rows={3}
                    value={example.input}
                    onChange={e =>
                      updateExample(index, "input", e.target.value)
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-sm font-mono"
                    placeholder={"4\n2 7 11 15\n9"}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Output (space-separated)
                  </label>
                  <textarea
                    rows={3}
                    value={example.output}
                    onChange={e =>
                      updateExample(index, "output", e.target.value)
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-sm font-mono"
                    placeholder="0 1"
                  />
                </div>
              </div>
              <div className="mt-2">
                <label className="block text-xs text-slate-400 mb-1">
                  Explanation (optional)
                </label>
                <input
                  type="text"
                  value={example.explanation || ""}
                  onChange={e =>
                    updateExample(index, "explanation", e.target.value)
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-sm"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Test Cases */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">
            Test Cases (for Judge0)
          </h2>
          <button
            type="button"
            onClick={addTestCase}
            className="text-sm text-blue-400 hover:text-blue-300">
            + Add Test Case
          </button>
        </div>

        <div className="space-y-4">
          {formData.testCases.map((testCase, index) => (
            <div key={index} className="border border-slate-700 rounded p-4">
              <div className="flex justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-400">
                    Test Case {index + 1}
                  </span>
                  <label className="flex items-center gap-1 text-xs text-slate-400">
                    <input
                      type="checkbox"
                      checked={testCase.isHidden}
                      onChange={e =>
                        updateTestCase(index, "isHidden", e.target.checked)
                      }
                      className="rounded"
                    />
                    Hidden
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => removeTestCase(index)}
                  className="text-sm text-red-400 hover:text-red-300">
                  Remove
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Input (press Enter for new lines)
                  </label>
                  <textarea
                    rows={4}
                    value={testCase.input}
                    onChange={e =>
                      updateTestCase(index, "input", e.target.value)
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-sm font-mono"
                    placeholder={"4\n2 7 11 15\n9"}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Expected Output (space-separated)
                  </label>
                  <textarea
                    rows={4}
                    value={testCase.output}
                    onChange={e =>
                      updateTestCase(index, "output", e.target.value)
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-sm font-mono"
                    placeholder="0 1"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs text-slate-400">
                    Additional Valid Outputs (for multi-answer problems)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const current = testCase.expectedOutputs || [];
                      updateTestCase(index, "expectedOutputs", [...current, ""]);
                    }}
                    className="text-xs text-blue-400 hover:text-blue-300">
                    + Add Alternative Output
                  </button>
                </div>

                <div className="space-y-3">
                  {(testCase.expectedOutputs || []).map((altOutput, altIndex) => (
                    <div key={altIndex} className="relative group">
                      <textarea
                        rows={3}
                        value={altOutput}
                        onChange={e => {
                          const newAltOutputs = [
                            ...(testCase.expectedOutputs || []),
                          ];
                          newAltOutputs[altIndex] = e.target.value;
                          updateTestCase(index, "expectedOutputs", newAltOutputs);
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-sm font-mono pr-12"
                        placeholder="Alternative valid output..."
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newAltOutputs = (
                            testCase.expectedOutputs || []
                          ).filter((_, i) => i !== altIndex);
                          updateTestCase(index, "expectedOutputs", newAltOutputs);
                        }}
                        className="absolute top-2 right-2 p-1.5 text-red-400 hover:bg-red-400/10 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove alternative output">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                  {(testCase.expectedOutputs || []).length === 0 && (
                    <p className="text-xs text-slate-600 italic">
                      No alternative outputs defined.
                    </p>
                  )}
                </div>

                <p className="text-xs text-slate-500 mt-2">
                  Each alternative output will be treated as a valid result.
                  The primary output is already checked by default.
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-slate-600 text-slate-300 hover:text-white rounded transition">
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition disabled:opacity-50">
          {loading
            ? "Saving..."
            : problem
              ? "Update Problem"
              : "Create Problem"}
        </button>
      </div>
    </form>
  );
}
