interface ShopAvatarProps {
  name: string
  logoUrl?: string
  size?: 'sm' | 'md'
}

export function ShopAvatar({ name, logoUrl, size = 'md' }: ShopAvatarProps) {
  const initials = (name || '')
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  if (logoUrl) {
    return <img src={logoUrl} alt={`${name} logo`} className={`shop-avatar shop-avatar-${size}`} loading="lazy" />
  }

  return <div className={`shop-avatar shop-avatar-${size} shop-avatar-fallback`}>{initials}</div>
}
