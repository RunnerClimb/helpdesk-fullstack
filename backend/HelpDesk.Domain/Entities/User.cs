using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Net.Sockets;
using System.Text;
using System.Threading.Tasks;
using System.Xml.Linq;

namespace HelpDesk.Domain.Entities
{
    public class User
    {
            public int Id { get; set; }
            public string Email { get; set; } = string.Empty;

            public string DisplayName { get; set; } = string.Empty;


        public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
        public ICollection<Comment> Comments { get; set; } = new List<Comment>();

    }
}
