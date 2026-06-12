using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HelpDesk.Domain.Exceptions
{
    public class DomainException : Exception
    {

        public DomainException(string message) : base(message)
        {


        }

    }

    public class NotFoundException : DomainException
    {
        public NotFoundException(string entity, object id)
            : base($"{entity} con id '{id}' no fue encontrado.") { }
    }

    public class InvalidStatusTransitionException : DomainException
    {
        public InvalidStatusTransitionException(string from, string to)
            : base($"Transición de estado inválida: {from} → {to}") { }
    }





}
