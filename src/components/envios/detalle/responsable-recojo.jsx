export default function ResponsableRecojo({ envio }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="h-5 w-5" /> Responsable de Recojo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Nombre:</span>
          <span className="font-medium">
            {`${envio?.responsableRecojoNombre || "No especificado"}${
              envio?.responsableRecojoApellidos
                ? ` ${envio.responsableRecojoApellidos}`
                : ""
            }`}
          </span>
        </div>
        {envio?.responsableRecojoTipoDocumento &&
          envio?.responsableRecojoNumeroDocumento && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Documento:</span>
              <span className="font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {`${envio.responsableRecojoTipoDocumento}: ${envio.responsableRecojoNumeroDocumento}`}
              </span>
            </div>
          )}
        {envio?.responsableRecojoTelefono && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Teléfono:</span>
            <span className="font-medium flex items-center gap-2">
              <Phone className="h-4 w-4" />
              {envio.responsableRecojoTelefono}
            </span>
          </div>
        )}
        {envio?.responsableRecojoEmail && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email:</span>
            <span className="font-medium flex items-center gap-2">
              <Mail className="h-4 w-4" />
              {envio.responsableRecojoEmail}
            </span>
          </div>
        )}
        {envio?.responsableRecojoDireccion && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Dirección:</span>
            <span className="font-medium">
              {envio.responsableRecojoDireccion}
            </span>
          </div>
        )}
        {(envio?.responsableRecojoEmpresa || envio?.responsableRecojoCargo) && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Empresa / Cargo:</span>
            <span className="font-medium">
              {`${envio?.responsableRecojoEmpresa || ""}${
                envio?.responsableRecojoCargo
                  ? ` - ${envio.responsableRecojoCargo}`
                  : ""
              }`}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
