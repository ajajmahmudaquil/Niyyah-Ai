import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, StickyNote, Trash2 } from "lucide-react";
import { format } from "date-fns";
import type { Note } from "@shared/schema";

export default function NotesPage() {
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [search, setSearch] = useState("");

  const { data: notesList, isLoading } = useQuery<Note[]>({
    queryKey: ["/api/notes"],
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/notes", {
        date: format(new Date(), "yyyy-MM-dd"),
        content,
        tags: tags ? tags.split(",").map((t) => t.trim()) : [],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setContent("");
      setTags("");
      toast({ title: "Note saved" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to save", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/notes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Note deleted" });
    },
  });

  const filteredNotes = notesList?.filter((note) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      note.content.toLowerCase().includes(q) ||
      note.tags?.some((t) => t.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-6 space-y-6 pb-20 md:pb-6">
      <div>
        <h1 className="text-2xl font-bold">Notes</h1>
        <p className="text-muted-foreground text-sm">Capture your daily thoughts and reflections</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">New Note</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="Write something meaningful..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            data-testid="textarea-note-content"
          />
          <div className="flex gap-2 flex-wrap">
            <Input
              placeholder="Tags (comma-separated)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="flex-1 min-w-[200px]"
              data-testid="input-note-tags"
            />
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={!content.trim() || saveMutation.isPending}
              data-testid="button-save-note"
            >
              <Plus className="w-4 h-4 mr-2" />
              Save Note
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
          data-testid="input-search-notes"
        />
      </div>

      <div className="space-y-3">
        {isLoading ? (
          [1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)
        ) : filteredNotes && filteredNotes.length > 0 ? (
          filteredNotes.map((note) => (
            <Card key={note.id} data-testid={`card-note-${note.id}`}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(note.date), "MMM d, yyyy")}
                      </span>
                      {note.tags?.map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteMutation.mutate(note.id)}
                    data-testid={`button-delete-note-${note.id}`}
                  >
                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <StickyNote className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No notes yet. Start writing!</p>
          </div>
        )}
      </div>
    </div>
  );
}
