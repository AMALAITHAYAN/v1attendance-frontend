export async function getPublicIp() {
  try {
    const res = await fetch("https://api.ipify.org?format=json");
    const data = await res.json();
    return data?.ip || "";
  } catch (err) {
    console.error("Could not fetch public IP", err);
    return "";
  }
}
