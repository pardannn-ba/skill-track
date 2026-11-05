import { supabase } from "./supabase";

export async function testDatabase() {
  const { data, error } = await supabase
    .from("skills")
    .select("id, name, slug");

  if (error) {
    console.log("DATABASE ERROR:", error.message);
    return;
  }

  console.log("DATABASE BERHASIL TERHUBUNG!");
  console.log("DATA SKILL:", data);
}