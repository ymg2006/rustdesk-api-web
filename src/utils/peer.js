export const connectByClient = (id) => {
  // Open the URL protocol without a new window. Format: rustdesk://<id>
  // window.open(`rustdesk://${row.id}`)
  let a = document.createElement('a')
  a.href = `rustdesk://${id}`
  a.target = '_self'
  a.click()

}
