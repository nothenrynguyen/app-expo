import Image from "next/image";

export function LogoMark() {
  return <Image aria-hidden="true" className="logo-mark" src="/app-expo-logo.png" alt="" width={44} height={44} loading="eager" unoptimized />;
}
