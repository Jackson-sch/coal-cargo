export const authConfig = {
  providers: [], // Vacío para middlewar e
  callbacks: {
    authorized({ token, request: { nextUrl } }) {
      // Lógica de autorización aquí si es necesari a
      return !!token;
    },
  },
};
