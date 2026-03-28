import { useState } from "react";
import { Download, Check, Save } from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import Papa from "papaparse";
import { CardData } from "@workspace/api-client-react";

interface ExtractedDataFormProps {
  data: CardData;
}

export function ExtractedDataForm({ data }: ExtractedDataFormProps) {
  const [isCopied, setIsCopied] = useState(false);

  const { register, control, getValues } = useForm<CardData>({
    defaultValues: {
      name: data.name || "",
      company: data.company || "",
      designation: data.designation || "",
      address: data.address || "",
      website: data.website || "",
      phones: data.phones?.length ? data.phones : [""],
      emails: data.emails?.length ? data.emails : [""],
    },
  });

  const { fields: phoneFields, append: appendPhone, remove: removePhone } = useFieldArray({
    control,
    name: "phones" as never, // Type assertion due to generic string[] array issue in RHF
  });

  const { fields: emailFields, append: appendEmail, remove: removeEmail } = useFieldArray({
    control,
    name: "emails" as never,
  });

  const downloadJSON = () => {
    const values = getValues();
    const blob = new Blob([JSON.stringify(values, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `card-${values.name.replace(/\s+/g, '-').toLowerCase() || 'data'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadCSV = () => {
    const values = getValues();
    // Flatten arrays for CSV
    const flatData = {
      ...values,
      phones: values.phones.join(" | "),
      emails: values.emails.join(" | "),
    };
    
    const csv = Papa.unparse([flatData]);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `card-${values.name.replace(/\s+/g, '-').toLowerCase() || 'data'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-2xl border border-border bg-card shadow-xl shadow-black/5 animate-in slide-in-from-bottom-4 duration-500 overflow-hidden">
      <div className="border-b border-border bg-muted/30 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-xl font-semibold text-foreground">Extracted Information</h3>
          <p className="text-sm text-muted-foreground mt-1">Review and edit before saving</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={downloadCSV}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-sm font-semibold text-secondary-foreground transition-all hover:bg-secondary/80 hover:shadow-md active:scale-95"
          >
            <Download className="h-4 w-4" />
            CSV
          </button>
          <button
            onClick={downloadJSON}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30 active:scale-95"
          >
            <Download className="h-4 w-4" />
            JSON
          </button>
        </div>
      </div>

      <div className="p-6">
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Full Name</label>
              <input
                {...register("name")}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                placeholder="John Doe"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Job Title</label>
              <input
                {...register("designation")}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                placeholder="Software Engineer"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Company</label>
              <input
                {...register("company")}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                placeholder="Acme Corp"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Website</label>
              <input
                {...register("website")}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                placeholder="https://example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Address</label>
            <textarea
              {...register("address")}
              rows={2}
              className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
              placeholder="123 Business St..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Phone Numbers</label>
                <button
                  type="button"
                  onClick={() => appendPhone("")}
                  className="text-xs font-semibold text-primary hover:text-primary/80"
                >
                  + Add Number
                </button>
              </div>
              <div className="space-y-2">
                {phoneFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2">
                    <input
                      {...register(`phones.${index}` as const)}
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                      placeholder="+1 (555) 000-0000"
                    />
                    {phoneFields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePhone(index)}
                        className="rounded-xl px-3 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                      >
                        &times;
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Email Addresses</label>
                <button
                  type="button"
                  onClick={() => appendEmail("")}
                  className="text-xs font-semibold text-primary hover:text-primary/80"
                >
                  + Add Email
                </button>
              </div>
              <div className="space-y-2">
                {emailFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2">
                    <input
                      {...register(`emails.${index}` as const)}
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                      placeholder="john@example.com"
                    />
                    {emailFields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEmail(index)}
                        className="rounded-xl px-3 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                      >
                        &times;
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
