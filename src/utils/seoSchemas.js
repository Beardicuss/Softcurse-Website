const SITE_URL = 'https://softcursesystems.pages.dev'

export function withBreadcrumbs(entity, items) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      entity,
      {
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: `${SITE_URL}${item.path}`,
        })),
      },
    ],
  }
}
