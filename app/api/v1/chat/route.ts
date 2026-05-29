import { createGroq } from "@ai-sdk/groq";
import { streamText } from "ai";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY!,
});

const PLATFORM_SYSTEM_PROMPT = `You are the official AI Assistant for VCollab. Your role is to provide highly precise, direct, and professional support regarding the VCollab platform.

# Core Directives
1. **Be Extremely Direct**: Never use conversational filler, long introductions, or unsolicited conclusions. Answer ONLY the exact question asked in the most concise way possible.
2. **Domain Restriction**: You may ONLY discuss VCollab features, user data, and site navigation. If a user asks about anything else (e.g., coding, general knowledge, math, recipes), you MUST politely decline: "I am the VCollab assistant. I can only assist with questions related to the VCollab platform." Do NOT use this refusal for simple greetings or valid platform questions.
3. **Data Presentation**: If "Live Platform Data" is provided to you at the bottom of this prompt, it contains the real-time information the user requested. Present this data in a seamless, professional, and courteous manner (e.g., "Here are the latest projects on the platform:"). Do NOT mention "Live Platform Data" or "the database" directly.
4. **Professional Formatting & Emojis**: Always use professional Markdown. You MUST use relevant emojis when discussing core platform entities (e.g., Projects 📁, Posts 📝, Blogs 📖, Users 👥). Use **bolding** for emphasis, \`inline code\` for technical terms, and unordered lists to cleanly break down information.
5. **Never Hallucinate Data**: If the user asks for a specific list (like projects or contributors) and that list is NOT provided in the "Live Platform Data", you MUST reply that you do not have that data right now. NEVER invent fake names, fake users, or fake projects.

# Platform Overview
VCollab is a professional academic network and collaboration platform built by VTECH AI Solutions for school and university students to showcase projects, share knowledge, and collaborate.
URL: http://localhost:5173

# Core Features
- **Projects (/projects)**: Digital portfolios where students showcase academic work with GitHub links, live demos, PDFs, and media. Users can send project collaboration requests.
- **Posts (/posts)** & **Blogs (/blogs)**: Short-form updates and long-form knowledge sharing articles.
- **User Ecosystem**: Follow system, real-time WebSocket messaging (/messages), personalized feeds (/home), and instant notifications.
- **Content Targeting**: Content can be targeted to ALL, SCHOOL, UNIVERSITY, or specific INSTITUTIONS.
- **Admin & Safety**: Full admin console, content reporting, and a formal user warning system.

# User Roles
- **USER (Student)**: Create content, follow peers, send collaboration requests.
- **ADMIN (Super Admin)**: Moderate content, manage users, review audit logs.

# Education Types
- **SCHOOL**: Grades 1–12, O/L, A/L.
- **UNIVERSITY**: Undergraduates (Years 1–4).

You are the definitive guide for VCollab. Execute all instructions flawlessly and directly.
`;

async function fetchLivePlatformData(userMessage: string) {
  const supabase = createSupabaseAdminClient();
  const lower = userMessage.toLowerCase();
  const results: string[] = [];

  // Search for projects matching user query
  const searchTerms = userMessage.replace(/[^\w\s]/gi, "").split(/\s+/).filter(w => w.length > 2);
  
  if (searchTerms.length > 0 && (lower.includes("project") || lower.includes("show") || lower.includes("find") || lower.includes("search") || lower.includes("what") || lower.includes("tell") || lower.includes("about"))) {
    for (const term of searchTerms.slice(0, 3)) {
      const { data: projects } = await supabase
        .from("projects")
        .select(`
          id, title, short_desc, tags, tech_stack, github_url, demo_url, like_count, view_count,
          owner:users!projects_owner_id_fkey(username, user_profiles!user_profiles_user_id_fkey(full_name))
        `)
        .eq("visibility", "PUBLIC")
        .eq("is_active", true)
        .is("deleted_at", null)
        .or(`title.ilike.%${term}%,short_desc.ilike.%${term}%,tags.ilike.%${term}%`)
        .limit(3);

      if (projects && projects.length > 0) {
        const projectList = projects.map((p: any) => {
          return `- [${p.title}](/projects/${p.id})`;
        }).join("\n");
        results.push(`**Projects found for "${term}":**\n${projectList}`);
        break;
      }
    }
  }

  // Fetch recent projects if user asks generally
  if (results.length === 0 && (lower.includes("project") || lower.includes("recent") || lower.includes("latest") || lower.includes("trending"))) {
    const { data: recent } = await supabase
      .from("projects")
      .select(`id, title, short_desc, like_count, view_count, owner:users!projects_owner_id_fkey(username, user_profiles!user_profiles_user_id_fkey(full_name))`)
      .eq("visibility", "PUBLIC")
      .eq("is_active", true)
      .is("deleted_at", null)
      .order(lower.includes("trending") || lower.includes("popular") ? "like_count" : "created_at", { ascending: false })
      .limit(5);

    if (recent && recent.length > 0) {
      const list = recent.map((p: any) => {
        return `- [${p.title}](/projects/${p.id})`;
      }).join("\n");
      results.push(`**${lower.includes("trending") ? "Trending" : "Latest"} Projects on VCollab:**\n${list}`);
    }
  }

  // Platform stats
  if (lower.includes("how many") || lower.includes("stats") || lower.includes("statistic") || (lower.includes("users") && lower.includes("count"))) {
    const [{ count: userCount }, { count: projectCount }, { count: blogCount }] = await Promise.all([
      supabase.from("users").select("*", { count: "exact", head: true }).eq("status", "ACTIVE"),
      supabase.from("projects").select("*", { count: "exact", head: true }).eq("visibility", "PUBLIC").eq("is_active", true).is("deleted_at", null),
      supabase.from("blogs").select("*", { count: "exact", head: true }).eq("visibility", "PUBLIC").eq("is_active", true).is("deleted_at", null),
    ]);
    results.push(`**VCollab Platform Stats:**\n- 👥 Active Users: ${userCount ?? 0}\n- 📁 Public Projects: ${projectCount ?? 0}\n- 📝 Published Blogs: ${blogCount ?? 0}`);
  }

  // Fetch Contributors/Users
  if (results.length === 0 && (lower.includes("contributor") || lower.includes("users") || lower.includes("author") || lower.includes("member") || lower.includes("people"))) {
    const { data: users } = await supabase
      .from("user_profiles")
      .select(`full_name, user_id, users!user_profiles_user_id_fkey(username)`)
      .limit(10);
      
    if (users && users.length > 0) {
      const list = users.map((u: any) => {
        return `- [${u.full_name || u.users?.username}](/profile/${u.users?.username})`;
      }).join("\n");
      results.push(`**Platform Contributors:**\n${list}`);
    }
  }

  return results.length > 0 ? "\n\n---\n**Live Platform Data:**\n" + results.join("\n\n") : "";
}

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    const lastUserMsg = [...messages].reverse().find((m: any) => m.role === "user");
    const liveData = lastUserMsg ? await fetchLivePlatformData(lastUserMsg.content) : "";
    const systemPrompt = PLATFORM_SYSTEM_PROMPT + (liveData ? liveData : "");

    const result = streamText({
      model: groq("llama-3.3-70b-versatile"),
      system: systemPrompt,
      messages,
    });

    // Manually pump the async iterable into a ReadableStream<Uint8Array>
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.textStream) {
            controller.enqueue(encoder.encode(chunk));
          }
        } catch (err) {
          console.error("Stream error:", err);
          controller.enqueue(encoder.encode("⚠️ I'm temporarily unavailable. Please try again in a moment."));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error: any) {
    console.error("Chat API error:", error);
    const msg = "Sorry, I couldn't process your request. Please try again.";
    return new Response(msg, {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
