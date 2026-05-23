import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Upload as UploadIcon, FileImage, X, CheckCircle, AlertCircle } from "lucide-react";
import { uploadDocuments } from "../api/client";

const ACCEPTED = { "image/jpeg": [".jpg", ".jpeg"], "image/png": [".png"], "image/tiff": [".tiff", ".tif"], "image/bmp": [".bmp"], "application/pdf": [".pdf"] };

export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const onDrop = useCallback((accepted: File[]) => {
    setFiles((prev) => [...prev, ...accepted]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    multiple: true,
  });

  const remove = (idx: number) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const mutation = useMutation({
    mutationFn: () => uploadDocuments(files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      setFiles([]);
      navigate("/dashboard");
    },
  });

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Upload Documents</h1>
      <p className="text-gray-500 text-sm mb-6">
        Supported formats: JPG, PNG, TIFF, BMP, PDF. Max 50 MB per file.
        <br />
        Use a multi-document scanner for best results.
      </p>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
          isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400 bg-gray-50"
        }`}
      >
        <input {...getInputProps()} />
        <UploadIcon className="mx-auto text-gray-400 mb-3" size={40} />
        <p className="text-gray-600 font-medium">
          {isDragActive ? "Drop files here…" : "Drag & drop images or PDFs here, or click to browse"}
        </p>
        <p className="text-gray-400 text-xs mt-1">Delivery tickets, Bills of Lading, or combined images</p>
      </div>

      {files.length > 0 && (
        <div className="mt-6 space-y-2">
          {files.map((file, idx) => (
            <div key={idx} className="flex items-center gap-3 bg-white border rounded-lg px-4 py-2 shadow-sm">
              <FileImage size={18} className="text-blue-500 shrink-0" />
              <span className="flex-1 text-sm text-gray-700 truncate">{file.name}</span>
              <span className="text-xs text-gray-400">{(file.size / 1024).toFixed(0)} KB</span>
              <button onClick={() => remove(idx)} className="text-gray-400 hover:text-red-500 transition-colors">
                <X size={16} />
              </button>
            </div>
          ))}

          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
              className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white px-6 py-2 rounded-lg font-medium text-sm transition-colors"
            >
              <UploadIcon size={16} />
              {mutation.isPending ? `Processing ${files.length} file(s)…` : `Upload ${files.length} file(s)`}
            </button>
            <button onClick={() => setFiles([])} className="text-sm text-gray-500 hover:text-gray-700">
              Clear all
            </button>
          </div>

          {mutation.isSuccess && (
            <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-sm mt-2">
              <CheckCircle size={16} /> Documents submitted. Redirecting to dashboard…
            </div>
          )}
          {mutation.isError && (
            <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm mt-2">
              <AlertCircle size={16} /> Upload failed. Please try again.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
