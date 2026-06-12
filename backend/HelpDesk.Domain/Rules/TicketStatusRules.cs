using HelpDesk.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HelpDesk.Domain.Rules
{
    public class TicketStatusRules
    {

        private static readonly Dictionary<TicketStatus, TicketStatus[]> _allowedTransitions = new()
    {
        { TicketStatus.Open,       [TicketStatus.InProgress] },
        { TicketStatus.InProgress, [TicketStatus.Resolved] },
        { TicketStatus.Resolved,   [TicketStatus.Closed, TicketStatus.InProgress] },
        { TicketStatus.Closed,     [] }
    };

        public static bool IsValidTransition(TicketStatus from, TicketStatus to)
            => _allowedTransitions.TryGetValue(from, out var allowed) && allowed.Contains(to);




    }
}
    